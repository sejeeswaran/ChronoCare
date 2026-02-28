import subprocess
import time
import os
import sys

def main():
    print("=" * 60)
    print("🚀 Starting Innoverse Hybrid Chronic Risk Intelligence Engine")
    print("=" * 60)
    
    # Paths
    project_root = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(project_root, "frontend")
    
    # Platform-specific npm command
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    
    # 1. Start Flask API (Backend)
    print("Starting Backend API on http://127.0.0.1:5000 ...")
    backend_process = subprocess.Popen(
        [sys.executable, "app.py"],
        cwd=project_root,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(2)
    print("✅ Backend API initialized")
    
    # 2. Start Vite server (Frontend) on port 5173
    print("Starting Frontend (Vite) on http://localhost:5173 ...")
    frontend_process = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )
    
    print("\n" + "=" * 60)
    print("🌟 ALL SYSTEMS GO! 🌟")
    print("Navigate to: http://localhost:5173")
    print("Press Ctrl+C to stop all servers.")
    print("=" * 60)
    
    try:
        # Keep main running while processes run
        while backend_process.poll() is None and frontend_process.poll() is None:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping servers gracefully...")
    finally:
        # Cleanup backend
        backend_process.terminate()
        try:
            backend_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            backend_process.kill()
            
        # Cleanup frontend
        frontend_process.terminate()
        try:
            frontend_process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            frontend_process.kill()
            
        print("✅ Servers stopped.")

if __name__ == "__main__":
    main()
