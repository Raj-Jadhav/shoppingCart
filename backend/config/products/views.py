from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny
from .models import Product
from .serializers import ProductSerializer

class ProductListView(ListAPIView):
    queryset = Product.objects.all()[:3]  # Only 3 items
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
