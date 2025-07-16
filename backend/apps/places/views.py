from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from services.google_places import google_places_service


class PlaceSearchView(generics.GenericAPIView):
    """Search for places using Google Places API."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        query = request.GET.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Optional parameters
        lat = request.GET.get('lat')
        lng = request.GET.get('lng')
        radius = int(request.GET.get('radius', 50000))
        place_type = request.GET.get('type')
        
        location = (float(lat), float(lng)) if lat and lng else None
        
        try:
            results = google_places_service.search_places(
                query=query,
                location=location,
                radius=radius,
                place_type=place_type
            )
            return Response({'results': results})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PlaceDetailView(generics.GenericAPIView):
    """Get detailed information about a specific place."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, place_id):
        try:
            place_data = google_places_service.get_place_details(place_id)
            if place_data:
                return Response(place_data)
            else:
                return Response({'error': 'Place not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NearbyPlacesView(generics.GenericAPIView):
    """Get places near a specific location."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        lat = request.GET.get('lat')
        lng = request.GET.get('lng')
        
        if not lat or not lng:
            return Response({'error': 'Latitude and longitude parameters are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        radius = int(request.GET.get('radius', 5000))
        place_type = request.GET.get('type')
        
        try:
            results = google_places_service.get_nearby_places(
                latitude=float(lat),
                longitude=float(lng),
                radius=radius,
                place_type=place_type
            )
            return Response({'results': results})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)