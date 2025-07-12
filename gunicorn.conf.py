# Increase timeout to 120 seconds (default is 30)
timeout = 120

# Keep alive connections for 5 seconds (default is 2)
keepalive = 5

# Restart workers after 10 requests (prevents memory leaks)
max_requests = 10
max_requests_jitter = 2

# Preload the app to speed up worker startup
preload_app = True
