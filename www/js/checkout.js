app.controller('CheckOutCtrl', function($scope, $rootScope, $ionicPopup, $ionicModal, $timeout, $ionicLoading, $ionicScrollDelegate, $localstorage, $rootScope, $http, $ionicHistory, $state, $cordovaGeolocation) {
    var map;
    $scope.init = function() {
        if ($localstorage.get('UserProduct') == null || $localstorage.get('UserProduct') === undefined || $localstorage.get('UserProduct') == '') {
            $rootScope.GoToHome();
        }
        $scope.model = {
            FirstName: '',
            Email: '',
            Address: '',
            isGoogleAdd: false,
            OrderTotal: 0,
            ShippingCharge: 0,
            TotalCharge: 0,
            SelectedAddress: null,
            PhoneNo: '',
            Street: '',
            idArea: '',
            idLandmark: '',
            Address1: '',
            Pincode: '',
        }
        $scope.iSOrderPlaced = false;
        $scope.DisplayOrderSummary = false;
        $scope.flgNewAddress = false;
        $scope.OrderId = '';
        $scope.GetUserInfo();
        $scope.GetAllBillingAddressByUser();
        $scope.GetAllActiveArea();
    }
    $scope.GetUserInfo = function() {
        var params = {
            UserId: $localstorage.get("UserId"),
        }
        $http.get(Api_Url + 'app_common/GetUserInformationByUserId', { params: params }).success(function(data) {
            if (data.success) {
                $scope.LstUserData = data.data;
                $scope.model.FirstName = data.data.ProfileName != '' && data.data.ProfileName != null ? data.data.ProfileName : data.data.phone;
                $scope.model.Email = data.data.email;
                $scope.model.Address1 = data.data.Address;
                $scope.model.PhoneNo = data.data.phone;
            }
        })
    }

    $scope.GetAllActiveArea = function() {
        $http.get(Api_Url + 'app_common/GetAllArea').success(function(data) {
            $scope.LstArea = data;
        })
    }

    $scope.GetAllLandmarkByArea = function(o) {
        $scope.model.idLandmark = '';
        var params = {
            idArea: o
        }
        $http.get(Api_Url + 'app_common/GetAllLandmarkByArea', { params: params }).success(function(data) {
            $scope.LstLandmark = data;
        })
    }

    $scope.GetAllBillingAddressByUser = function() {
        var params = {
            UserId: $localstorage.get("UserId"),
        }
        $http.get(Api_Url + 'app_common/GetAllBillingAddressByUser', { params: params }).success(function(data) {
            if (data.success) {
                $scope.lstBillAddress = data.data;
                $scope.model.SelectedAddress = $scope.lstBillAddress[0].id;
                $scope.model.Address = $scope.lstBillAddress[0].Address1;
                $scope.model.Email = $scope.lstBillAddress[0].Email;
                $scope.model.PhoneNo = $scope.lstBillAddress[0].PhoneNo;
                $scope.model.FirstName = $scope.lstBillAddress[0].FirstName;
                $scope.model.Pincode = $scope.lstBillAddress[0].PostCode;
                $scope.model.idArea = $scope.lstBillAddress[0].idArea;
                $scope.model.idLandmark = $scope.lstBillAddress[0].idLandmark;
            } else {
                $scope.lstBillAddress = [];
                $scope.ChangeAddress('New');
            }
        })
    }

    $scope.DeleteBillingAddress = function(idBillAdderss) {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete Address',
            template: "Are you sure want to delete this address",
            cssClass: 'custPop warning',
            buttons: [{
                text: 'Cancel',
                type: 'cBtn cBtn-warning',
                onTap: function(e) {
                    return false;
                }

            }, {
                text: 'ok',
                type: 'cBtn cBtn-warning',
                onTap: function(e) {

                    return true;

                }
            }]
        });
        confirmPopup.then(function(res) {
            if (res) {
                $rootScope.Loading();
                var params = {
                    id: idBillAdderss,
                }
                $http.get(Api_Url + 'app_common/DeleteCustomerBillingAddress', { params: params }).success(function(data) {
                    $rootScope.HideLoading();
                    if (data.success) {
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'success',
                            template: data.message,
                            cssClass: 'custPop success',
                            buttons: [{
                                text: 'Ok',
                                type: 'cBtn cBtn-success',
                            }]
                        });
                        $scope.init();
                    } else {
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Error',
                            template: data.message,
                            cssClass: 'custPop error',
                            buttons: [{
                                text: 'Ok',
                                type: 'cBtn cBtn-error',
                            }]
                        });
                    }
                })
            }
        })
    }

    $scope.ChangeAddress = function(id) {
        if (id == 'New') {
            $scope.model.SelectedAddress = 'New';
            $scope.model.Pincode = '';
            $scope.model.idArea = '';
            $scope.model.idLandmark = '';
            $scope.model.Address = '';
            $scope.flgNewAddress = true;
        } else if (id == null || id == undefined || id == "") {
            $scope.model.SelectedAddress = $scope.lstBillAddress[0].id;
            $scope.model.Address = $scope.lstBillAddress[0].Address1;
            $scope.model.Email = $scope.lstBillAddress[0].Email;
            $scope.model.PhoneNo = $scope.lstBillAddress[0].PhoneNo;
            $scope.model.FirstName = $scope.lstBillAddress[0].FirstName;
            $scope.model.Pincode = $scope.lstBillAddress[0].PostCode;
            $scope.model.idArea = $scope.lstBillAddress[0].idArea;
            $scope.model.idLandmark = $scope.lstBillAddress[0].idLandmark;
            $scope.flgNewAddress = false;
            $scope.model.isGoogleAdd = false;
            $scope.formsubmit = false;
        } else {
            var obj = _.findWhere($scope.lstBillAddress, { id: id });
            $scope.model.SelectedAddress = obj.id;
            $scope.model.Address = obj.Address1;
            $scope.model.Email = obj.Email;
            $scope.model.PhoneNo = obj.PhoneNo;
            $scope.model.FirstName = obj.FirstName;
            $scope.model.Pincode = obj.PostCode;
            $scope.model.idArea = obj.idArea;
            $scope.model.idLandmark = obj.idLandmark;
        }
    }

    //google map
    $scope.SetMap = function() {
        $scope.model.Address = '';

        setTimeout(function() {
            var mapLayer = document.getElementById("map");
            var centerCoordinates = new google.maps.LatLng(21.170240, 72.831062);
            var defaultOptions = { center: centerCoordinates, zoom: 10 }
            map = new google.maps.Map(mapLayer, defaultOptions);
            $scope.getCurrentLocation();
        }, 1000)
    }

    $scope.getCurrentLocation = function() {
        var posOptions = {
            timeout: 7000,
            enableHighAccuracy: false
        };
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function(position) {
            var currentLatitude = position.coords.latitude;
            var currentLongitude = position.coords.longitude;
            var text = {
                Latitude: currentLatitude,
                Longitude: currentLongitude,
            }
            GetAddressLocation(text, function(Address) {
                if (Address != '' && Address != null) {
                    var currentLocation = { lat: currentLatitude, lng: currentLongitude };
                    var marker = new google.maps.Marker({
                        position: currentLocation,
                        map: map,
                        title: 'Hello ' + $scope.model.FirstName
                    });
                    $ionicLoading.hide();
                    $scope.model.Address = Address;

                    google.maps.event.addListener(marker, 'click', (function(marker) {
                        return function() {
                            var infoWindowHTML = $scope.model.Address;
                            var infoWindow = new google.maps.InfoWindow({ map: map, content: infoWindowHTML });
                            infoWindow.setPosition(currentLocation);
                        }
                    })(marker));

                } else {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Location',
                        template: "No Address Found",
                        cssClass: 'custPop error',
                        buttons: [{
                            text: 'Ok',
                            type: 'cBtn cBtn-error',
                        }]
                    });
                }
            })
        }).catch(function(err) {})
    }

    function GetAddressLocation(text, Callback) {
        var result = '';
        var latlng = new google.maps.LatLng(parseFloat(text.Latitude), parseFloat(text.Longitude));
        // var latlng = text;
        var geocoder = new google.maps.Geocoder;
        geocoder.geocode({ 'location': latlng }, function(results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    result = results[0].formatted_address;
                    return Callback(result);
                } else {
                    return Callback(result);
                }
            } else {
                return Callback(result);
            }
        });
        // return result;
    }



    $scope.scrollTop = function() {
        $ionicScrollDelegate.$getByHandle('my-handle').scrollTop();
    };
    $scope.formsubmit = false;
    $scope.GoToOrderSummary = function(form) {
        if (form.$invalid) {
            $scope.scrollTop();
            $scope.formsubmit = true;
        } else {
            if ($scope.model.SelectedAddress == 'New') {
                if (!$scope.model.isGoogleAdd || $scope.model.isGoogleAdd == '0' || $scope.model.isGoogleAdd == 0) {
                    if ($scope.model.Address1 != '' && $scope.model.Address1 != null) {
                        if ($scope.model.Address == "") {
                            $scope.model.Address = $scope.model.Address1;
                        } else {
                            $scope.model.Address += ", " + $scope.model.Address1;
                        }
                    }
                    // if ($scope.model.Street != '' && $scope.model.Street != null) {
                    //     if ($scope.model.Address == "") {
                    //         $scope.model.Address = $scope.model.Street;
                    //     } else {
                    //         $scope.model.Address += ", " + $scope.model.Street;
                    //     }
                    // }
                    if ($scope.model.idArea != '' && $scope.model.idArea != null) {
                        var Area = _.findWhere($scope.LstArea, { id: parseInt($scope.model.idArea) });

                        if (Area) {
                            if ($scope.model.Address == "") {
                                $scope.model.Address = Area.Name;
                            } else {
                                $scope.model.Address += ", " + Area.Name;
                            }
                        }
                    }
                    if ($scope.model.idLandmark != '' && $scope.model.idLandmark != null) {
                        var Landmark = _.findWhere($scope.LstLandmark, { id: parseInt($scope.model.idLandmark) });
                        if (Landmark) {
                            if ($scope.model.Address == "") {
                                $scope.model.Address = Landmark.Name;
                            } else {
                                $scope.model.Address += ", " + Landmark.Name;
                            }
                        }
                    }

                    // if ($scope.model.Pincode != '' && $scope.model.Pincode != null) {
                    //     if ($scope.model.Address == "") {
                    //         $scope.model.Address = $scope.model.Pincode;
                    //     } else {
                    //         $scope.model.Address += ", " + $scope.model.Pincode;
                    //     }
                    // }
                    finalObject();
                } else {
                    finalObject()
                }
            } else {
                finalObject()
            }

            function finalObject() {
                var OrderTotal = 0;
                if ($localstorage.get('TotalPrice') != null && $localstorage.get('TotalPrice') != undefined && $localstorage.get('TotalPrice') != '') {
                    var OrderTotal = $localstorage.get('TotalPrice');
                }
                if (parseInt(OrderTotal) < parseInt($rootScope.OrderLimit)) {
                    $scope.model.OrderAmount = parseFloat(OrderTotal).toFixed(2);
                    $scope.model.ShippingCharge = parseFloat($rootScope.ShippingCharge).toFixed(2);
                    $scope.model.OrderTotal = parseFloat($scope.model.OrderAmount) + parseFloat($rootScope.ShippingCharge);
                    $scope.model.OrderTotal = parseInt($scope.model.OrderTotal).toFixed(2);
                } else {
                    $scope.model.OrderAmount = parseFloat(OrderTotal).toFixed(2);
                    $scope.model.OrderTotal = parseInt(OrderTotal).toFixed(2);
                    $scope.model.ShippingCharge = 0;

                }
                $scope.CreateOrder();
            }


        }
    }

    $scope.CreateOrder = function() {
        $rootScope.Loading();
        var OrderList = [];
        if ($localstorage.get('UserProduct') != null && $localstorage.get('UserProduct') != undefined && $localstorage.get('UserProduct') != '') {
            OrderList = JSON.parse($localstorage.get('UserProduct'));
        }
        if (OrderList.length > 0 && $scope.model.OrderTotal > 0) {
            var o = $scope.model;
            o.UserId = $localstorage.get("UserId");
            o.phone = $localstorage.get("UserPhone");
            var ProductList = [];
            for (var i = 0; i < OrderList.length; i++) {
                var ObjOrderDetail = {
                    ProductId: OrderList[i].ProductId,
                    ProductName: OrderList[i].p_info.Name,
                    Qty: OrderList[i].Qty,
                    Price: OrderList[i].Price,
                    Attributes: OrderList[i].Attribute,
                    AttributeValue: OrderList[i].AttributeValue,
                    AttributePrice: OrderList[i].KgPrice,
                    ProductImage: OrderList[i].p_info.FileName,
                }
                ProductList.push(ObjOrderDetail);
            }
            var obj = {
                order: o,
                orderDetail: ProductList
            }
            $http.post(Api_Url + "app_common/SaveOrder", obj).success(function(data) {
                $rootScope.HideLoading();
                if (data.success == true) {
                    $localstorage.set('UserProduct', '');
                    $localstorage.set('TotalPrice', '');
                    $scope.OrderId = data.OrderId;
                    $scope.ClientNo = data.ClientNo;
                    $scope.iSOrderPlaced = true;
                } else {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Order Failed',
                        template: "Your order is not placed..",
                        cssClass: 'custPop error',
                        buttons: [{
                            text: 'Ok',
                            type: 'cBtn cBtn-error',
                        }]
                    });
                };
            });
        } else {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Order Failed',
                template: "Your order is not placed..",
                cssClass: 'custPop error',
                buttons: [{
                    text: 'Ok',
                    type: 'cBtn cBtn-error',
                }]
            });
        }

    }

    $scope.init();

});