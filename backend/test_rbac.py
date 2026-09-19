"""
Unit test for RBAC login and analytics scoping
"""
import unittest
from app import app

class TestRBAC(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_login_success(self):
        res = self.client.post("/api/login", json={"username": "admin_hospital", "password": "hosp123"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["user"]["role"], "Hospital")

    def test_login_invalid(self):
        res = self.client.post("/api/login", json={"username": "admin_hospital", "password": "wrongpassword"})
        self.assertEqual(res.status_code, 401)

    def test_analytics_unauthorized(self):
        res = self.client.get("/api/analytics")
        self.assertEqual(res.status_code, 401)

    def test_analytics_user_forbidden(self):
        res = self.client.get("/api/analytics", headers={"Authorization": "Bearer token_elderly_user_User"})
        self.assertEqual(res.status_code, 403)

    def test_analytics_hospital_global(self):
        res = self.client.get("/api/analytics", headers={"Authorization": "Bearer token_admin_hospital_Hospital"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["role"], "Hospital")
        self.assertEqual(data["session_count"], 15)  # All 15 sessions in DB

    def test_analytics_ngo_regional(self):
        res = self.client.get("/api/analytics", headers={"Authorization": "Bearer token_ngo_worker_NGO"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["role"], "NGO")
        self.assertEqual(data["scope"], "Assam")
        self.assertEqual(data["session_count"], 12)  # 10 device_alpha + 2 device_gamma in Assam

    def test_analytics_family_device_scoped(self):
        res = self.client.get("/api/analytics", headers={"Authorization": "Bearer token_family_carer_Family"})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["role"], "Family")
        self.assertEqual(data["scope"], "device_alpha")
        self.assertEqual(data["session_count"], 10)  # 10 sessions for device_alpha

if __name__ == "__main__":
    unittest.main()
