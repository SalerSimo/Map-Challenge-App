from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os

app = Flask(__name__, static_folder='src')

@app.route('/api/run-python', methods=['POST'])
def run_python():
    data = request.json
    function_name = data['functionName']
    args = data['args']
    print(str(args))
    result = subprocess.run(['python', 'pythonFunctions.py', function_name, str(args)], capture_output=True, text=True)
    print(result)
    return jsonify({'result': result.stdout.strip()})

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'home.html')
    

if __name__ == '__main__':
    app.run(debug=True)


