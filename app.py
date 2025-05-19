from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os

from pythonFunctions import findPath

app = Flask(__name__, static_folder='src')

@app.route('/api/run-python', methods=['POST'])
def run_python():
    data = request.json
    args = data['args']
    result = findPath(args)
    return jsonify({'result': result})

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'home_mobile.html')
    

if __name__ == '__main__':
    app.run(debug=True)


