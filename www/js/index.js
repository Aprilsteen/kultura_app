let siteWindow = false
let currentPushToken = false
let payloadWait = ''

let push = false
let resumed = false

document.addEventListener("resume", onResume, false);

function onResume() {
    resumed = true
}


let errorWithFirstConnectOrOpenUrl = () => {
    document.body.className = 'mode-offline';

    setTimeout(() => {
        openAppWindow()
    }, 5000)

    if (siteWindow === false) {
        return
    }

    siteWindow.hide()
}

let openAppWindow = () => {
    push.on('notification', (data) => {
        console.log(
            data.additionalData,
            data.additionalData.click_action,
            data.additionalData.notId,
        )
        if (
            typeof data === 'undefined'
            || typeof data.additionalData === 'undefined'
            || typeof data.additionalData.click_action === 'undefined'
            || typeof data.additionalData.notId === "undefined"
        ) {
            return
        }

        if (
            typeof data.additionalData.foreground !== 'undefined'
            && data.additionalData.foreground === true
        ) {
            return
        }

        if (data.additionalData.coldstart === true && resumed !== true) {
            payloadWait = data.additionalData.notId
            console.log('PUSH: set payload', data.additionalData.notId)
        } else {
            siteWindow.executeScript({
                    code: "loadPushId('" + data.additionalData.notId + "')"
                }
            )
            console.log('PUSH: execute loadPushId', data.additionalData.notId)
        }
    });
    if (siteWindow === false) {
        if (navigator.onLine/* && navigator.connection.type !== Connection.CELL_2G*/) {
            document.body.className = 'mode-online';

            const options = 'location=no,toolbar=no,hideurlbar=yes,hidenavigationbuttons=yes,lefttoright=yes,zoom=no';
            siteWindow = cordova.InAppBrowser.open('https://clinic-complex.ru/mobileapp/pinpad/?version=152&version_app=android', '_blank', options)

            siteWindow.addEventListener('loaderror', function (params) {
                console.log('ERROR', params.message)
                errorWithFirstConnectOrOpenUrl()
                siteWindow.close()
                siteWindow = false
            })

            siteWindow.addEventListener('loadstop', function () {
                if (payloadWait !== '') {
                    let tmp = payloadWait
                    payloadWait = ''

                    siteWindow.executeScript({
                            code: "loadPushId('" + tmp + "')"
                        }
                    );
                }
            })

            siteWindow.addEventListener('message', (params) => {
                if (typeof params.data.type === 'undefined') {
                    return
                }

                if (params.data.type === 'setTopColor') {
                    console.log('set top color:')
                    console.log(params.data.color)
                    console.log('length:', window.document.getElementById('body').length)
                    try {
                        console.log('current',window.document.getElementById('body').style.backgroundColor);
                        window.document.getElementById('body').style.backgroundColor = params.data.color
                        console.log('new',window.document.getElementById('body').style.backgroundColor);
                    } catch (e) {

                    }
                }

                if (params.data.type === 'openUrlInBrowser') {
                    console.log('open system browser:')
                    console.log(params.data.url)

                    window.open(params.data.url, '_system')
                }

                if (params.data.type === 'pinPadSaveOnPhone') {
                    console.log('save pin code')

                    window.localStorage.setItem('pinValue', params.data.pinValue);
                }

                if (params.data.type === 'pinPadAuthByPhoneEvent') {
                    const savedPinValue = window.localStorage.getItem('pinValue');

                    // после того как пин успешно сохранен уже будем проверять
                    // есть ли возможность авторизоваться телефоном,
                    // а до этого не будем донимать пользователя
                    if (typeof savedPinValue === 'undefined' || savedPinValue.length === 0) {
                        return false
                    }

                    Fingerprint.isAvailable(() => {
                        Fingerprint.show({
                            description: "Клиники СМТ"
                        }, () => {
                            siteWindow.executeScript({
                                    code: "pinPadTryPin('" + savedPinValue + "')"
                                }
                            );
                        }, (error) => {
                        });
                    }, () => {
                    });
                }

                console.log(params.data.type)

                if (
                    params.data.type === 'pushNotificationRegistration'
                    || params.data.type === 'pushNotificationRegistrationCancel'
                ) {
                    if (params.data.type === 'pushNotificationRegistrationCancel') {
                        params.data.emc_profile_id = 0

                        // удаляем сохраненный пин при выходе пользователя
                        window.localStorage.removeItem('pinValue');
                    }

                    if (typeof params.data.emc_profile_id === 'undefined') {
                        return
                    }

                    if (typeof params.data.token_type === 'undefined') {
                        params.data.token_type = ''
                    }

                    let onCurrentPushTokenChange = () => {
                        if (currentPushToken === false) {
                            return false;
                        }

                        console.log('push token:')
                        console.log(currentPushToken)
                        const localStorageKeyRegistration = "pushTokenSentRegistration"
                        const localStorageKeyRegistrationCancel = "pushTokenSentRegistrationCancel"

                        const localStorageKey = (params.data.type === 'pushNotificationRegistration') ? localStorageKeyRegistration : localStorageKeyRegistrationCancel
                        const pushTokenSent = window.localStorage.getItem(localStorageKey)
                        if (pushTokenSent === currentPushToken && params.data.token_type === '') {
                            console.log('=====================')
                            console.log('same token ' + params.data.type)
                            console.log(params.data.type)
                            console.log(localStorageKey)
                            return
                        }

                        const postData = {
                            'emc_profile_id': params.data.emc_profile_id,
                            'token': currentPushToken,
                            'token_type': params.data.token_type,
                            'sessid': params.data.sessid,
                            'device': device,
                            'action': params.data.type === 'pushNotificationRegistration' ? 'registration' : 'registrationCancel'
                        }

                        // если регистрируем токен, то разрешим потом отменять регистрацию
                        if (params.data.type === 'pushNotificationRegistration') {
                            window.localStorage.removeItem(localStorageKeyRegistrationCancel);
                            console.log('=====================')
                            console.log('remove ' + localStorageKeyRegistrationCancel)
                        } else if (params.data.type === 'pushNotificationRegistrationCancel') {
                            window.localStorage.removeItem(localStorageKeyRegistration);
                            console.log('=====================')
                            console.log('remove ' + localStorageKeyRegistration)
                        }

                        cordova.plugin.http.post('https://clinic-complex.ru/mobileapp/regpushtoken.php', postData, {}, function (response) {
                            if (params.data.token_type === '') {
                                // регистрацию пушей типа регистрации — один раз отправлем
                                // пуши на подписку о возобновлении работы приложения — сколь угодно раз
                                window.localStorage.setItem(localStorageKey, currentPushToken);
                                console.log(localStorageKey)
                            }
                            console.log('sent!')
                        }, function (response) {
                        });
                    }
                    console.log('currentPushToken')
                    console.log(currentPushToken)
                    if (currentPushToken !== false) {
                        console.log('onCurrentPushTokenChange')
                        onCurrentPushTokenChange(currentPushToken)
                    }
                }
            })
        } else {
            errorWithFirstConnectOrOpenUrl()
        }
    } else {
        siteWindow.show()
    }
}

document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("offline", () => {
    document.body.className = 'mode-offline';

    if (siteWindow === false) {
        return
    }

    siteWindow.hide()
}, false);
document.addEventListener("online", () => {
    document.body.className = 'mode-online';
    // openAppWindow()
}, false);

function onDeviceReady() {
    push = PushNotification.init({
        android: {},
        ios: {
            alert: true,
            badge: true,
            sound: true
        }
    });
    push.on('registration', (data) => {
        console.log('push registration')
        let token = data.registrationId
        console.log(token)

        currentPushToken = token
    })

    // PushNotification.hasPermission((data) => {
    //     console.log('-=-=-=-enabled-=-=-=-')
    //         console.log(data.isEnabled);
    // })

    push.on('error', (e) => {
        console.log('push error', e.message);
    });

    document.body.className = 'mode-online';

    openAppWindow()
}