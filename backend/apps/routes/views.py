from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class CalculateRouteView(generics.GenericAPIView):
    """Calculate route between waypoints."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        waypoints = request.data.get('waypoints', [])
        
        if len(waypoints) < 2:
            return Response({'error': 'At least 2 waypoints are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mock route calculation for now
        # TODO: Implement Google Directions API integration
        total_distance = len(waypoints) * 150  # Mock: 150 miles per segment
        total_time = total_distance / 60  # Mock: 60 mph average
        
        route_data = {
            'total_distance': total_distance,
            'total_time': total_time,
            'waypoints': waypoints,
            'legs': [
                {
                    'distance': {'text': '150 miles', 'value': 150},
                    'duration': {'text': '2.5 hours', 'value': 2.5}
                } for _ in range(len(waypoints) - 1)
            ]
        }
        
        return Response(route_data)


class RouteDetailView(generics.GenericAPIView):
    """Get details of a calculated route."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, route_id):
        # Mock route details for now
        return Response({
            'id': route_id,
            'total_distance': 450,
            'total_time': 7.5,
            'status': 'calculated'
        })