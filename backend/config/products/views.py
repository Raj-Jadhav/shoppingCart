
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowUnsafe
from django.core.cache import cache
from django.db.models import Q
from .models import Product
from .serializers import ProductSerializer, ProductListSerializer
import logging

logger = logging.getLogger(__name__)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Product operations.
    Provides list and retrieve actions with authentication.
    """
    queryset = Product.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        Uses functional approach to optimize response size.
        """
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        """
        Optimized queryset with caching.
        Implements query optimization for scaling.
        """
        queryset = super().get_queryset()
        
        # Filter by stock availability if requested
        in_stock_only = self.request.query_params.get('in_stock', None)
        if in_stock_only == 'true':
            queryset = queryset.filter(stock_quantity__gt=0)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset.select_related().prefetch_related()
    
    def list(self, request, *args, **kwargs):
        """
        List all active products with caching.
        Optimized for performance at scale.
        """
        cache_key = f"products_list_{request.query_params.urlencode()}"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            logger.info("Returning cached product list")
            return Response({
                'success': True,
                'data': cached_data,
                'cached': True
            })
        
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        
        # Cache for 5 minutes
        cache.set(cache_key, serializer.data, 300)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'cached': False
        })
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve single product details."""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def check_stock(self, request, pk=None):
        """
        Check if product has sufficient stock.
        Useful for cart validation before checkout.
        """
        product = self.get_object()
        requested_quantity = int(request.query_params.get('quantity', 1))
        
        can_fulfill = product.can_fulfill_quantity(requested_quantity)
        
        return Response({
            'success': True,
            'data': {
                'product_id': product.id,
                'product_name': product.name,
                'requested_quantity': requested_quantity,
                'available_stock': product.stock_quantity,
                'can_fulfill': can_fulfill,
                'message': 'Sufficient stock' if can_fulfill else 'Insufficient stock'
            }
        })