from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    OrderListSerializer,
    CheckoutSerializer
)
from cart.models import Cart, CartItem
from products.models import Product
import logging

logger = logging.getLogger(__name__)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for order operations.
    Provides order history and checkout functionality.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Get orders for current user.
        Optimized with select_related for performance.
        """
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items', 'items__product').order_by('-created_at')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return OrderListSerializer
        return OrderSerializer
    
    def list(self, request):
        """
        List all orders for current user.
        Supports filtering by status.
        """
        queryset = self.get_queryset()
        
        # Filter by status if provided
        order_status = request.query_params.get('status', None)
        if order_status:
            queryset = queryset.filter(status=order_status)
        
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def retrieve(self, request, pk=None):
        """Get detailed order information."""
        order = self.get_object()
        serializer = self.get_serializer(order)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """
        Process checkout with payment validation and change calculation.
        Implements complete e-commerce flow with stock management.
        """
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        amount_paid = serializer.validated_data['amount_paid']
        
        with transaction.atomic():
            # Get user's cart
            try:
                cart = Cart.objects.prefetch_related(
                    'items',
                    'items__product'
                ).get(user=request.user)
            except Cart.DoesNotExist:
                return Response({
                    'success': False,
                    'error': {
                        'message': 'Cart is empty. Please add items before checkout.',
                        'code': 'empty_cart'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate cart has items
            cart_items = cart.get_items()
            if not cart_items.exists():
                return Response({
                    'success': False,
                    'error': {
                        'message': 'Cart is empty. Please add items before checkout.',
                        'code': 'empty_cart'
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate cart total using functional programming
            cart_total = cart.calculate_total()
            
            # Validate payment amount
            if amount_paid < cart_total:
                shortage = cart_total - amount_paid
                return Response({
                    'success': False,
                    'error': {
                        'message': f'Insufficient payment. You are short by UGX {shortage:,.2f}',
                        'code': 'insufficient_payment',
                        'details': {
                            'required': str(cart_total),
                            'formatted_required': f'UGX {cart_total:,.2f}',
                            'provided': str(amount_paid),
                            'formatted_provided': f'UGX {amount_paid:,.2f}',
                            'shortage': str(shortage),
                            'formatted_shortage': f'UGX {shortage:,.2f}'
                        }
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate stock availability for all items
            stock_errors = []
            for cart_item in cart_items:
                if not cart_item.product.can_fulfill_quantity(cart_item.quantity):
                    stock_errors.append({
                        'product': cart_item.product.name,
                        'requested': cart_item.quantity,
                        'available': cart_item.product.stock_quantity
                    })
            
            if stock_errors:
                return Response({
                    'success': False,
                    'error': {
                        'message': 'Some items are out of stock or have insufficient quantity.',
                        'code': 'insufficient_stock',
                        'details': stock_errors
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create order
            order = Order.objects.create(
                user=request.user,
                total_amount=cart_total,
                amount_paid=amount_paid,
                status='pending'
            )
            
            # Create order items and reduce stock
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    product_name=cart_item.product.name,
                    product_price=cart_item.product.price,
                    quantity=cart_item.quantity
                )
                
                # Reduce stock using atomic operation
                cart_item.product.reduce_stock(cart_item.quantity)
            
            # Complete order (calculates change)
            order.complete()
            
            # Clear cart
            cart.clear()
            
            logger.info(
                f"Order #{order.id} completed for {request.user.username}. "
                f"Total: UGX {cart_total:,.2f}, Paid: UGX {amount_paid:,.2f}, "
                f"Change: UGX {order.change_amount:,.2f}"
            )
            
            # Serialize order
            order_data = order.to_dict()
        
        return Response({
            'success': True,
            'message': 'Order completed successfully! Thank you for your purchase.',
            'data': {
                'order': order_data,
                'payment_details': {
                    'total_amount': str(cart_total),
                    'formatted_total': f'UGX {cart_total:,.2f}',
                    'amount_paid': str(amount_paid),
                    'formatted_paid': f'UGX {amount_paid:,.2f}',
                    'change': str(order.change_amount),
                    'formatted_change': f'UGX {order.change_amount:,.2f}'
                }
            }
        }, status=status.HTTP_201_CREATED)