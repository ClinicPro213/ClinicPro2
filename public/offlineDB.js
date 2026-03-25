let db;

const request = indexedDB.open("clinicDB", 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    db.createObjectStore("offlinePatients", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;
};

function saveOfflinePatient(patient) {
    const tx = db.transaction("offlinePatients", "readwrite");
    const store = tx.objectStore("offlinePatients");
    store.add(patient);
}

function getOfflinePatients() {
    return new Promise((resolve) => {
        const tx = db.transaction("offlinePatients", "readonly");
        const store = tx.objectStore("offlinePatients");
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
    });
}

function clearOfflinePatients() {
    const tx = db.transaction("offlinePatients", "readwrite");
    const store = tx.objectStore("offlinePatients");
    store.clear();
}
