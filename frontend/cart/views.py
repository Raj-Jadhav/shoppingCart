from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CartItem
from .serializers import CartItemSerializer
from products.models import Product
from .utils import get_or_create_cart
from .services import calculate_total

class CartView(APIView):
    def get(self, request):
        cart = get_or_create_cart(request.user)
        items = cart.items.select_related("product")

        serializer = CartItemSerializer(items, many=True)
        total = calculate_total(items)

        return Response({
            "items": serializer.data,
            "total": total,
            "currency": "UGX"
        })
class AddToCartView(APIView):
    def post(self, request):
        product_id = request.data.get("product_id")

        if not product_id:
            return Response(
                {"error": "product_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        cart = get_or_create_cart(request.user)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product
        )

        if not created:
            item.quantity += 1
            item.save()

        return Response(
            {"message": "Item added to cart"},
            status=status.HTTP_201_CREATED
        )
class UpdateCartItemView(APIView):
    def patch(self, request):
        item_id = request.data.get("item_id")
        quantity = request.data.get("quantity")

        if not item_id or quantity is None:
            return Response(
                {"error": "item_id and quantity required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if quantity < 1:
            return Response(
                {"error": "Quantity must be at least 1"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        item.quantity = quantity
        item.save()

        return Response({"message": "Quantity updated"})
class RemoveCartItemView(APIView):
    def delete(self, request):
        item_id = request.data.get("item_id")

        try:
            item = CartItem.objects.get(
                id=item_id,
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response(
                {"error": "Item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        item.delete()
        return Response({"message": "Item removed"})
class CheckoutView(APIView):
    def post(self, request):
        cash_given = request.data.get("cash_given")

        if cash_given is None:
            return Response(
                {"error": "cash_given required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        cart = get_or_create_cart(request.user)
        items = cart.items.select_related("product")

        total = calculate_total(items)

        if cash_given < total:
            return Response(
                {
                    "error": "Insufficient funds",
                    "total": total,
                    "cash_given": cash_given
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        change = cash_given - total

        # Clear cart
        items.delete()

        return Response({
            "message": "Checkout successful",
            "total": total,
            "cash_given": cash_given,
            "change": change,
            "currency": "UGX"
        })
