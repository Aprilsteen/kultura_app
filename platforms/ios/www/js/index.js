let errorWithFirstConnectOrOpenUrl = () => {
    document.body.className = 'mode-offline';

    setTimeout(() => {
        openAppWindow()
    }, 5000);
}

let openAppWindow = () => {
    if (navigator.onLine) {
        //document.body.className = 'mode-online';

        var url = 'https://kultura-doma.ru/?source=app&version=1.0.4&version_app='+cordova.platformId+'&version_new=1';
        // window.location.href = url;

    } else {
        errorWithFirstConnectOrOpenUrl()
    }
}

document.addEventListener("deviceready", () => {
    document.body.className = 'mode-online';
    openAppWindow();
}, false);

document.addEventListener("offline", () => {
    document.body.className = 'mode-offline';
}, false);

document.addEventListener("online", () => {
    document.body.className = 'mode-online';
}, false);
