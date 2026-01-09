from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_stats, name='dashboard-stats'),
    path('products/', views.product_analytics, name='product-analytics'),
    path('revenue/', views.revenue_analysis, name='revenue-analysis'),
]