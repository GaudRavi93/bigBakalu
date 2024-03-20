var Api_Url = "https://bakaluapi.disolutions.net/";
// var Api_Url = "http://103.232.124.169:50000/";
// var SocketUrl = "https://bakaluapi.disolutions.net/";
// var Api_Url = "http://api.bakalu.in/";
// var SocketUrl = "http://api.bakalu.in/";
var AppVerifyTimeOut = 3000;
var VerifyTimeOut = 5000;

var app = angular.module('Bakalu', ['ionic', 'Bakalu.controllers', 'ngCordova', 'ngMaterial'])

    .run(function ($ionicPlatform, $rootScope, $cordovaDevice, $localstorage, $http, $ionicHistory, $state, $ionicLoading, $ionicPopup) {
        $localstorage.set('UserProduct', '');
        $localstorage.set('TotalPrice', '');
        $rootScope.IsPageLoading = false;
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

            function CheckAppVersion() {
                try {
                    $http.get(Api_Url + "app_common/GetSetting").success(function (data) {
                        if (data) {
                            var MissedCallNumber = _.findWhere(data, { Name: "MissedCallNumber" });
                            var OrderLimit = _.findWhere(data, { Name: "Order Limit" });
                            var Shipping = _.findWhere(data, { Name: "Shipping Charge" });
                            var CMS = _.findWhere(data, { Name: "CMS" });
                            $rootScope.MissedCallNumber = MissedCallNumber != null && MissedCallNumber != undefined && MissedCallNumber != '' ? MissedCallNumber.Value : '';
                            $rootScope.OrderLimit = OrderLimit != null && OrderLimit != undefined && OrderLimit != '' ? OrderLimit.Value : '';
                            $rootScope.ShippingCharge = Shipping != null && Shipping != undefined && Shipping != '' ? Shipping.Value : '';
                            $rootScope.OrderCMS = CMS.Value;
                            if (window.cordova) {
                                navigator.appInfo.getAppInfo(function (appInfo) {
                                    if (ionic.Platform.isIOS()) {
                                        var Ver = _.findWhere(data, { Name: "iOS Version" }).Value;
                                        var Url = _.findWhere(data, { Name: "iOS Url" }).Value;

                                    } else {

                                        var Ver = _.findWhere(data, { Name: "Android Version" }).Value;
                                        var Url = _.findWhere(data, { Name: "Android Url" }).Value;
                                    }
                                    var UpdateAppText = _.findWhere(data, { Name: "Update App text" }).Value;
                                    var AppValue = appInfo.version;

                                    if (parseFloat(Ver) > parseFloat(AppValue)) {
                                        $ionicLoading.hide();
                                        var VersionPopup = $ionicPopup.show({
                                            template: UpdateAppText,
                                            title: "Update App",
                                            cssClass: 'custPop',
                                            buttons: [{
                                                text: 'Download',
                                                type: 'cBtn cBtn-orange',
                                                onTap: function (e) {
                                                    return true;
                                                }
                                            },
                                            {
                                                text: 'Cancel',
                                                type: 'cBtn cBtn-orange',
                                                onTap: function (e) {
                                                    return false;
                                                }
                                            }
                                            ]
                                        });

                                        VersionPopup.then(function (res) {
                                            if (res) {
                                                window.open(Url, '_system', 'location=no');
                                            } else {
                                                CheckPhoneVerified();
                                            }
                                        });

                                    } else if (parseFloat(Ver) == parseFloat(AppValue)) {
                                        var DatabaseLastChar = Ver.substring(Ver.lastIndexOf('.') + 1, Ver.length);
                                        var AppLastChar = AppValue.substring(AppValue.lastIndexOf('.') + 1, AppValue.length);
                                        if (parseFloat(DatabaseLastChar) > parseFloat(AppLastChar)) {
                                            $ionicLoading.hide();
                                            var VersionPopup = $ionicPopup.show({
                                                template: UpdateAppText,
                                                title: "Update App",
                                                cssClass: 'custPop',
                                                buttons: [{
                                                    text: 'Download',
                                                    type: 'cBtn cBtn-orange',
                                                    onTap: function (e) {
                                                        return true;
                                                    }
                                                },
                                                {
                                                    text: 'Cancel',
                                                    type: 'cBtn cBtn-orange',
                                                    onTap: function (e) {
                                                        return false;
                                                    }
                                                }
                                                ]
                                            });
                                            VersionPopup.then(function (res) {
                                                if (res) {
                                                    window.open(Url, '_system', 'location=no');
                                                } else {
                                                    CheckPhoneVerified();
                                                }
                                            });
                                        } else {
                                            CheckPhoneVerified();
                                        }
                                    } else {

                                        CheckPhoneVerified();
                                    }
                                })
                            } else {
                                CheckPhoneVerified();
                            }
                        } else {
                            CheckPhoneVerified();
                        }
                    })

                } catch (ex) {
                    CheckPhoneVerified();
                }
            }
            CheckAppVersion();


            //checkPhone Verified
            function CheckPhoneVerified() {

                try {
                    $rootScope.uuid = $cordovaDevice.getUUID();
                    //check App Veriosn And Get Other Setting
                    if ($localstorage.get('UserPhone') != '' && $localstorage.get('UserPhone') != null && $localstorage.get('UserPhone') != undefined) {
                        $ionicLoading.show({
                            template: '<i class="icon ion-loading-c"></i> <ion-spinner icon="ios-small"></ion-spinner>'
                        });
                        setTimeout(function () {
                            var params = {
                                udid: $rootScope.uuid,
                                phone: $localstorage.get('UserPhone'),
                            }
                            $http.get(Api_Url + "app_common/CheckUserVerified", { params: params }).success(function (resUserData) {

                                $ionicLoading.hide();
                                if (resUserData.success) {

                                    $localstorage.set('UserId', resUserData.data.UserId);
                                    $localstorage.set('UserPhone', resUserData.data.UserPhone);
                                    $ionicHistory.nextViewOptions({
                                        disableBack: true
                                    });
                                    $state.go('app.products');
                                } else {
                                    $rootScope.IsVerifyFlg = false;
                                    setTimeout(function () {
                                        $rootScope.$apply(function () {
                                            $rootScope.IsPageLoading = true;
                                        });
                                    });
                                }
                            })
                        }, AppVerifyTimeOut);
                    } else {
                        $rootScope.IsVerifyFlg = true;
                        setTimeout(function () {
                            $rootScope.$apply(function () {
                                $rootScope.IsPageLoading = true;
                            });
                        });
                    }
                } catch (ex) {
                    $rootScope.IsVerifyFlg = true;
                    setTimeout(function () {
                        $rootScope.$apply(function () {
                            $rootScope.IsPageLoading = true;
                        });
                    });
                }
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider

            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppCtrl'
            })
            .state('app.login', {
                url: '/login',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/login.html',
                        controller: 'LoginCtrl'
                    }
                },
                cache: false
            })
            .state('app.products', {
                url: '/products',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/products.html',
                        controller: 'ProductsCtrl'
                    }
                },
                cache: false
            })
            .state('app.cart', {
                url: '/cart',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/cart.html',
                        controller: 'CartCtrl'
                    }
                },
                cache: false
            })
            .state('app.profile', {
                url: '/profile',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/profile.html',
                        controller: 'ProfileCtrl'
                    }
                },
                cache: false
            }).state('app.checkout', {
                url: '/checkout',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/checkout.html',
                        controller: 'CheckOutCtrl'
                    }
                },
                cache: false
            }).state('app.feedback', {
                url: '/feedback',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/feedback.html',
                        controller: 'FeedbackCtrl'
                    }
                },
                cache: false
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/login');
    }).factory('$localstorage', ['$window', function ($window) {
        return {
            set: function (key, value) {
                $window.localStorage[key] = value;
            },
            get: function (key, defaultValue) {
                return $window.localStorage[key] || defaultValue;
            },
            setObject: function (key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function (key) {
                return JSON.parse($window.localStorage[key] || '{}');
            }
        }
    }]).directive('numbersOnly', function () {
        return {
            require: 'ngModel',
            link: function (scope, element, attr, ngModelCtrl) {
                function fromUser(text) {
                    if (text) {
                        var transformedInput = text.replace(/[^0-9]/g, '');

                        if (transformedInput !== text) {
                            ngModelCtrl.$setViewValue(transformedInput);
                            ngModelCtrl.$render();
                        }
                        return transformedInput;
                    }
                    return undefined;
                }
                ngModelCtrl.$parsers.push(fromUser);
            }
        };
    }).directive('onErrorSrc', function () {
        return {
            link: function (scope, element, attrs) {
                element.bind('error', function () {
                    if (attrs.src != attrs.onErrorSrc) {
                        attrs.$set('src', attrs.onErrorSrc);
                    }
                });
            }
        }
    });