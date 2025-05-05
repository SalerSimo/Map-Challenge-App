/*const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    runPython: (functionName, args) => {
        console.log("running");
        ipcRenderer.send('run-python', { functionName, args })
    },
    onPythonResult: (callback) => ipcRenderer.on('python-result', (event, result) => callback(result))
});*/

function runPython(functionName, args) {
    return fetch('/api/run-python', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ functionName, args })
    })
    .then(response => response.json())
    .then(data => data.result);
}
