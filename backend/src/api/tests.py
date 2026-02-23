from django.test import TestCase

# Create your tests here.


class GEOSeriesViewSetTests(TestCase):
    def test_search_action(self):
        # Simulate a GET request to the search action
        response = self.client.get(
            "/api/series/search/", {"query": "lower respiratory tract disorder"}
        )

        # Check that the response is successful
        self.assertEqual(response.status_code, 200)

        # Check that the response contains the expected structure
        self.assertIn("count", response.data)
        self.assertIn("results", response.data)
        self.assertIn("facets", response.data)

        # Optionally, check that the count is as expected (assuming you know the expected count)
        # self.assertEqual(response.data['count'], expected_count)
