angular.module('Bakalu.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $rootScope, $ionicPopup, $state, $cordovaPush, $ionicPlatform, $localstorage, $http, $ionicHistory, $ionicLoading) {
    try {
        document.addEventListener("resume", function() {
            if ($localstorage.get('UserPhone') != '' && $localstorage.get('UserPhone') != null && $localstorage.get('UserPhone') != undefined) {
                $rootScope.Loading();
                setTimeout(function() {
                    var params = {
                        udid: $rootScope.uuid,
                        phone: $localstorage.get('UserPhone'),
                    }
                    $http.get(Api_Url + "app_common/CheckUserVerified", { params: params }).success(function(resUserData) {
                        $rootScope.HideLoading();
                        if (resUserData.success) {
                            $localstorage.set('UserId', resUserData.data.UserId);
                            $localstorage.set('UserPhone', resUserData.data.UserPhone);
                            $ionicHistory.nextViewOptions({
                                disableBack: true
                            });
                            $state.go('app.products');
                        } else {
                            $rootScope.$apply(function() {
                                $rootScope.IsPageLoading = true;
                            });
                            $rootScope.IsVerifyFlg = false;
                            var confirmPopup = $ionicPopup.alert({
                                title: 'Warning',
                                template: "Give Missed Call to Verify your Account.",
                                cssClass: 'custPop warning',
                                buttons: [{
                                    text: 'Ok',
                                    type: 'cBtn cBtn-warning',
                                }]
                            });
                        }
                    })
                }, VerifyTimeOut)
            }
        }, false);
        $rootScope.UserLogin = $localstorage.get('UserId') != null && $localstorage.get('UserId') != undefined && $localstorage.get('UserId') != '' ? true : false;
    } catch (ex) {
        $rootScope.UserLogin = false;
    }
    $rootScope.GoToHome = function() {

        $state.go('app.products');
    }
    $rootScope.GoToCart = function() {
        $state.go('app.cart');
    }
    $rootScope.GoToProfile = function() {
            $state.go('app.profile');
        }
        // var networkState = navigator.connection.type;
        // alert(networkState)
    document.addEventListener("offline", onOffline, false);

    function onOffline() {
        $rootScope.HideLoading();
        var alertPopup = $ionicPopup.show({
            template: "No Internet Connection Try Again Later..",
            title: "Network Error",
            cssClass: 'custPop',
            buttons: [{
                text: 'Ok',
                type: 'cBtn cBtn-orange',
            }]
        });
        // Handle the offline event
    }

    $scope.GetMisscallNumber = function() {
        $http.get(Api_Url + "app_common/GetSetting").success(function(data) {
            if (data) {
                var MissedCallNumber = _.findWhere(data, { Name: "MissedCallNumber" });
                var OrderLimit = _.findWhere(data, { Name: "Order Limit" });
                var Shipping = _.findWhere(data, { Name: "Shipping Charge" });
                var CMS = _.findWhere(data, { Name: "CMS" });
                $rootScope.MissedCallNumber = MissedCallNumber != null && MissedCallNumber != undefined && MissedCallNumber != '' ? MissedCallNumber.Value : '';
                $rootScope.OrderLimit = OrderLimit != null && OrderLimit != undefined && OrderLimit != '' ? OrderLimit.Value : '';
                $rootScope.ShippingCharge = Shipping != null && Shipping != undefined && Shipping != '' ? Shipping.Value : '';
                $rootScope.OrderCMS = CMS.Value;
            }

        })
    }

    $rootScope.Loading = function() {
        $ionicLoading.show({
            template: '<i class="icon ion-loading-c"></i> <ion-spinner icon="ios-small"></ion-spinner>'
        });
    }
    $rootScope.HideLoading = function() {
            $ionicLoading.hide();
        }
        // $scope.GetMisscallNumber();
    $rootScope.Logout = function() {
        $rootScope.UserLogin = false;
        $scope.$watch('aModel', function() {
            $localstorage.set('UserProduct', '');
            $localstorage.set('TotalPrice', '');
            $localstorage.set('UserId', '');
            $localstorage.set('UserPhone', '');
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go('app.login');
        });
    }


    //Push Notification Code
    if (window.cordova) {
        setTimeout(function() {
            $ionicPlatform.ready(function() {
                try {
                    $rootScope.uuid = $cordovaDevice.getUUID();
                } catch (ex) {}

                function Subscribe_PushNotification() {
                    var config = null;
                    if (ionic.Platform.isAndroid()) {
                        config = {
                            "badge": "true",
                            "sound": "true",
                            "alert": "true",
                            "senderID": "397099291487"
                        };
                    } else if (ionic.Platform.isIOS()) {
                        config = {
                            "badge": "true",
                            "sound": "true",
                            "alert": "true"
                        }
                    }

                    try {
                        document.addEventListener("deviceready", function() {
                            $cordovaPush.register(config).then(function(result) {
                                // ** NOTE: Android regid result comes back in the pushNotificationReceived, only iOS returned here
                                if (ionic.Platform.isIOS()) {
                                    $scope.regId = result;
                                    storeDeviceToken("ios");
                                }
                            }, function(err) { alert(err) });
                        }, false);
                    } catch (errr) {
                        // alert(errr);
                    }
                }

                // Notification Received
                $scope.$on('$cordovaPush:notificationReceived', function(event, notification) {
                    if (ionic.Platform.isAndroid()) {
                        handleAndroid(notification);
                    } else if (ionic.Platform.isIOS()) {
                        handleIOS(notification);
                        $scope.$apply(function() {
                            $scope.notifications.push(JSON.stringify(notification.alert));
                        })
                    }
                });

                // Android Notification Received Handler
                function handleAndroid(notification) {

                    if (notification.event == "registered") {
                        $scope.regId = notification.regid;
                        storeDeviceToken("android");
                    } else if (notification.event == "message") {
                        var notifyMsg = notification;

                        var alertPopup = $ionicPopup.show({
                            title: notifyMsg.payload.title,
                            template: notifyMsg.payload.message,
                            cssClass: 'custPop',
                            buttons: [{
                                text: 'Ok',
                                type: 'cBtn cBtn-orange',
                            }]
                        });

                    } else if (notification.event == "error")
                        $cordovaDialogs.alert(notification.msg, "Push notification error event");
                    else $cordovaDialogs.alert(notification.event, "Push notification handler - Unprocessed Event");
                }

                // IOS Notification Received Handler
                function handleIOS(notification) {
                    var notifyMsg = notification;

                    var alertPopup = $ionicPopup.show({
                        title: notifyMsg.message,
                        template: notifyMsg.alert,
                        cssClass: 'custPop',
                        buttons: [{
                            text: 'Ok',
                            type: 'cBtn cBtn-orange',
                        }]
                    });

                }

                // Stores the device token in a db using node-pushserver (running locally in this case)
                // type:  Platform type (ios, android etc)
                function storeDeviceToken(Platform) {
                    var objPush = {
                        PushNotificationId: $scope.regId,
                        Platform: Platform,
                        udid: $rootScope.uuid,
                        iduser: 0,
                        Country: "India",
                        Type: 'DefaultApp'
                    };

                    var UserId = $localstorage.get('UserId');
                    if (UserId != null && UserId != undefined && UserId != '') {
                        objPush.iduser = UserId;
                    };

                    $http.post(Api_Url + 'pushnotification/Subscribe', objPush).success(function(data, status) {}).error(function(data, status) {})
                }

                Subscribe_PushNotification();

            }, false);
        }, 1000);
    }
    //END of Push Notification

    // backButtonHandle

    document.addEventListener('backbutton', function(evt) {
        if ($state.current.name.indexOf('app.products') >= 0) {
            navigator.app.exitApp();
        }
    }, false);
})

.controller('LoginCtrl', function($scope, $ionicModal, $timeout, $ionicLoading, $localstorage, $rootScope, $http, $ionicHistory, $state, $ionicPopup, $cordovaInAppBrowser) {
    $scope.init = function() {
        // if ($localstorage.get('UserId') != null && $localstorage.get('UserId') != undefined && $localstorage.get('UserId') != '') {
        //     $state.go('app.products');
        // }
        $scope.ResetModel();
    }
    $scope.formsubmit = false;
    $scope.Login = function(o, form) {
        if (form.$invalid) {
            $scope.formsubmit = true;
            return;
        }
        $rootScope.Loading();
        o.uuid = $rootScope.uuid;
        // o.uuid = "b932b3fac987cf04";
        o.createddate = new Date();
        $localstorage.set('UserPhone', o.phone);
        $http.post(Api_Url + "app_common/MobileAppLogin", o).success(function(data) {
            $rootScope.HideLoading();
            if (data.success == true) {
                if (data.IsVerify) {
                    // $ionicLoading.show({
                    //     template: '<p class="text-center">Login Successful...</p>'
                    // });
                    $scope.$watch('aModel', function() {
                        $localstorage.set('UserProduct', '');
                        $localstorage.set('TotalPrice', '');
                        $localstorage.set('UserId', data.data.id);
                        $localstorage.set('UserPhone', data.data.phone);
                        $ionicHistory.nextViewOptions({
                            disableBack: true
                        });
                        $state.go('app.products');
                    })
                } else {
                    $rootScope.IsVerifyFlg = false;
                }
            } else {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Login Failed',
                    template: data.message,
                    cssClass: 'custPop error',
                    buttons: [{
                        text: 'Ok',
                        type: 'cBtn cBtn-error',
                    }]
                });
            };
        });
    }


    $scope.BackToLogin = function(form) {
        $rootScope.Loading();
        setTimeout(function() {
            var params = {
                udid: $rootScope.uuid,
                phone: $localstorage.get('UserPhone'),
            }
            $http.get(Api_Url + "app_common/CheckUserVerified", { params: params }).success(function(resUserData) {
                $rootScope.HideLoading();
                if (resUserData.success) {
                    $localstorage.set('UserId', resUserData.data.UserId);
                    $localstorage.set('UserPhone', resUserData.data.UserPhone);
                    $ionicHistory.nextViewOptions({
                        disableBack: true
                    });
                    $state.go('app.products');
                } else {
                    var confirmPopup = $ionicPopup.alert({
                        title: 'Warning',
                        template: "Give Missed Call to Verify your Account.",
                        cssClass: 'custPop warning',
                        buttons: [{
                            text: 'Ok',
                            type: 'cBtn cBtn-warning',
                        }]
                    });
                }
            })
        }, VerifyTimeOut);
    }

    $scope.Call = function() {
        if ($rootScope.MissedCallNumber != '' && $rootScope.MissedCallNumber != null & $rootScope.MissedCallNumber != undefined) {
            try {
                if (ionic.Platform.isIOS()) {
                    $cordovaInAppBrowser.open('tel://' + $rootScope.MissedCallNumber.replace("-", "").replace(" ", ""), '_system');
                } else {
                    $cordovaInAppBrowser.open('tel:' + $rootScope.MissedCallNumber, '_system');
                }
            } catch (ex) {}
        }
    }


    $scope.ResetModel = function() {
        $scope.model = {
            phone: '',
            uuid: '',
            createddate: '',
        }
    }
    $scope.init();
})