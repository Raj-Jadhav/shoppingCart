from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register new user with validation.
    Returns JWT tokens on successful registration.
    """
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    password_confirm = request.data.get('password_confirm', '')
    
    # Validation
    if not all([username, email, password, password_confirm]):
        return Response({
            'success': False,
            'error': {
                'message': 'All fields are required.',
                'code': 'missing_fields'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if password != password_confirm:
        return Response({
            'success': False,
            'error': {
                'message': 'Passwords do not match.',
                'code': 'password_mismatch'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(password) < 8:
        return Response({
            'success': False,
            'error': {
                'message': 'Password must be at least 8 characters long.',
                'code': 'weak_password'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({
            'success': False,
            'error': {
                'message': 'Username already exists.',
                'code': 'username_exists'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({
            'success': False,
            'error': {
                'message': 'Email already registered.',
                'code': 'email_exists'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    with transaction.atomic():
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"New user registered: {username}")
    
    return Response({
        'success': True,
        'message': 'Registration successful!',
        'data': {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate user and return JWT tokens.
    Implements secure login with proper error handling.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    
    if not username or not password:
        return Response({
            'success': False,
            'error': {
                'message': 'Username and password are required.',
                'code': 'missing_credentials'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response({
            'success': False,
            'error': {
                'message': 'Invalid username or password.',
                'code': 'invalid_credentials'
            }
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({
            'success': False,
            'error': {
                'message': 'Account is disabled.',
                'code': 'account_disabled'
            }
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    logger.info(f"User logged in: {username}")
    
    return Response({
        'success': True,
        'message': 'Login successful!',
        'data': {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user by blacklisting refresh token.
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        logger.info(f"User logged out: {request.user.username}")
        
        return Response({
            'success': True,
            'message': 'Logout successful!'
        })
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({
            'success': True,
            'message': 'Logout successful!'
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get current user profile information.
    """
    user = request.user
    
    return Response({
        'success': True,
        'data': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'date_joined': user.date_joined.isoformat()
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh access token using refresh token.
    """
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response({
            'success': False,
            'error': {
                'message': 'Refresh token is required.',
                'code': 'missing_token'
            }
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)
        
        return Response({
            'success': True,
            'data': {
                'access': access_token
            }
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': {
                'message': 'Invalid or expired refresh token.',
                'code': 'invalid_token'
            }
        }, status=status.HTTP_401_UNAUTHORIZED)