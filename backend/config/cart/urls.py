from django.urls import path
from .views import CartViewSet

urlpatterns = [
    path('', CartViewSet.as_view({'get': 'list'}), name='cart-list'),
    path('add-item/', CartViewSet.as_view({'post': 'add_item'}), name='cart-add-item'),
    path('update-item/<int:item_id>/', CartViewSet.as_view({'put': 'update_item'}), name='cart-update-item'),
    path('remove-item/<int:item_id>/', CartViewSet.as_view({'delete': 'remove_item'}), name='cart-remove-item'),
    path('clear/', CartViewSet.as_view({'delete': 'clear'}), name='cart-clear'),
]