app.controller('CartCtrl', function($scope, $http, $cordovaGeolocation, $ionicModal, $timeout, $localstorage, $ionicLoading, $state, $rootScope, $ionicPopup) {
    $scope.init = function() {
        $scope.LstCart = [];
        $scope.TotalAmount = 0;
        if ($localstorage.get('UserProduct') != null && $localstorage.get('UserProduct') != undefined && $localstorage.get('UserProduct') != '') {
            $scope.LstCart = JSON.parse($localstorage.get('UserProduct'));
        }
        if ($localstorage.get('TotalPrice') != null && $localstorage.get('TotalPrice') != undefined && $localstorage.get('TotalPrice') != '') {
            $scope.TotalAmount = $localstorage.get('TotalPrice');
        }
        if ($scope.LstCart.length == 0) {
            $rootScope.GoToHome();
        }
        $scope.InitCheckOut();
    }

    $scope.AddProduct = function(item, flg) {
        try {
            var audio = new Audio(Api_Url + "MediaUploads/button-click.mp3");
            audio.play();
        } catch (ex) {

        }
        if (item.P_Attributes[0].productattributevalues.length > 0) {
            if (item.P_Attributes[0].Attribute.Name != 'Nos') {
                //Add or Remove Qty
                if (flg == 'Add') {
                    item.Qty = (parseFloat(item.Qty) + parseFloat(item.AttributeQty)).toFixed(3);
                } else {
                    item.Qty = (parseFloat(item.Qty) - parseFloat(item.AttributeQty)).toFixed(3);
                }
                //display Weight
                item.DisplayWeight = item.Qty < 1 ? "Gram" : "KG";
                //Manage Attributes price
                if (flg == 'Add') {
                    if (item.Qty >= 0.5 && item.Qty < 5) {
                        item.AttributeQty = 0.5;
                    } else if (item.Qty >= 5 && item.Qty < 20) {
                        item.AttributeQty = 1;
                    } else if (item.Qty >= 20) {
                        item.AttributeQty = 5;
                    } else if (item.Qty <= 0.5) {
                        item.AttributeQty = item.MinimumAttrQty;
                    }
                } else {
                    if (item.Qty > 0.5 && item.Qty < 5) {
                        item.AttributeQty = 0.5;
                    } else if (item.Qty >= 5 && item.Qty < 20) {
                        item.AttributeQty = 1;
                    } else if (item.Qty >= 20) {
                        item.AttributeQty = 5;
                    } else if (item.Qty <= 0.5) {
                        item.AttributeQty = item.MinimumAttrQty;
                    }
                }
                //SetMinimumWeight Adustment
                if (item.Qty < 1) {
                    item.Product_Weight = parseInt(item.Qty * 1000).toString();
                } else {
                    item.Product_Weight = (parseFloat(item.Qty).toFixed(1) * 1000 / 1000).toString();
                }
                item.AttributePrice = parseFloat(item.Qty * item.KgPrice).toFixed(2);
                item.Price = item.AttributePrice;
            } else {
                //Add or Remove Qty
                if (flg == 'Add') {
                    item.Qty = item.Qty + item.AttributeQty;
                } else {
                    item.Qty = item.Qty - item.AttributeQty;
                }
                item.Product_Weight = item.Qty;
                var findQty = item.Qty / item.AttributeQty;
                item.Price = findQty * item.KgPrice;
            }
            //save LocalStrorage
            var objfindProduct = _.findWhere($scope.LstCart, {
                ProductId: item.p_info.Id,
            });
            if (!objfindProduct) {
                $scope.LstCart.push(item);
            } else {
                objfindProduct = item;
            }
            if (item.Qty == 0 && item.Price == 0) {
                if ($scope.LstCart.length > 0) {
                    $scope.LstCart = _.filter($scope.LstCart, function(data) {
                        if (data.ProductId != item.p_info.Id) {
                            return data;
                        }
                    })
                }
            }
            $localstorage.set('UserProduct', JSON.stringify($scope.LstCart));
            //save Total
            $scope.ManageTotalPrice();
            if ($scope.LstCart.length == 0) {
                $rootScope.GoToHome();
            }
        }
    }

    $scope.ManageTotalPrice = function() {
        $scope.TotalAmount = 0;
        if ($scope.LstCart.length > 0) {
            _.each($scope.LstCart, function(item) {
                $scope.TotalAmount = $scope.TotalAmount + parseFloat(item.Price);
            })
            $scope.TotalAmount = parseFloat($scope.TotalAmount).toFixed(2);
        }
        $localstorage.set('TotalPrice', $scope.TotalAmount);
        $scope.TotalFunction();
    }

    $scope.RemoveFromCart = function(obj) {
        if ($scope.LstCart.length > 0) {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Remove Product',
                template: 'Are you sure you want to Remove this product?',
                cssClass: 'custPop warning',
                buttons: [{
                    text: 'No',
                    type: 'cBtn cBtn-gray'
                }, {
                    text: 'Yes',
                    type: 'cBtn cBtn-warning',
                    onTap: function() {
                        $scope.LstCart = _.filter($scope.LstCart, function(data) {
                            if (data.ProductId != obj.ProductId) {
                                return data;
                            }
                        })
                        if ($scope.LstCart.length == 0) {
                            $localstorage.set('TotalPrice', 0);
                            $localstorage.set('UserProduct', '');
                            $rootScope.GoToHome();
                        } else {
                            $localstorage.set('UserProduct', JSON.stringify($scope.LstCart));
                            $scope.ManageTotalPrice();
                        }
                    }
                }]
            });
        }
    }

    $scope.CheckOut = function() {
        $state.go('app.checkout');
    }


    // ********************************************************CheckOutPage*************************************************************************************************
    $scope.InitCheckOut = function() {
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
        $scope.TotalFunction();
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
                $scope.model.SelectedAddress = $scope.lstBillAddress.id;
                $scope.model.Address = $scope.lstBillAddress.Address1;
                $scope.model.Email = $scope.lstBillAddress.Email;
                $scope.model.PhoneNo = $scope.lstBillAddress.PhoneNo;
                $scope.model.FirstName = $scope.lstBillAddress.FirstName;
                $scope.model.Pincode = $scope.lstBillAddress.PostCode;
                $scope.model.idArea = $scope.lstBillAddress.idArea;
                $scope.model.idLandmark = $scope.lstBillAddress.idLandmark;
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
        }
        // } else if (id == null || id == undefined || id == "") {
        //     $scope.model.SelectedAddress = $scope.lstBillAddress[0].id;
        //     $scope.model.Address = $scope.lstBillAddress[0].Address1;
        //     $scope.model.Email = $scope.lstBillAddress[0].Email;
        //     $scope.model.PhoneNo = $scope.lstBillAddress[0].PhoneNo;
        //     $scope.model.FirstName = $scope.lstBillAddress[0].FirstName;
        //     $scope.model.Pincode = $scope.lstBillAddress[0].PostCode;
        //     $scope.model.idArea = $scope.lstBillAddress[0].idArea;
        //     $scope.model.idLandmark = $scope.lstBillAddress[0].idLandmark;
        //     $scope.flgNewAddress = false;
        //     $scope.model.isGoogleAdd = false;
        //     $scope.formsubmit = false;
        // } else {
        //     var obj = _.findWhere($scope.lstBillAddress, { id: id });
        //     $scope.model.SelectedAddress = obj.id;
        //     $scope.model.Address = obj.Address1;
        //     $scope.model.Email = obj.Email;
        //     $scope.model.PhoneNo = obj.PhoneNo;
        //     $scope.model.FirstName = obj.FirstName;
        //     $scope.model.Pincode = obj.PostCode;
        //     $scope.model.idArea = obj.idArea;
        //     $scope.model.idLandmark = obj.idLandmark;
        // }
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
            // $scope.scrollTop();
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
                    finalObject();
                } else {
                    finalObject()
                }
            } else {
                finalObject()
            }

            function finalObject() {
                // var OrderTotal = 0;
                // if ($localstorage.get('TotalPrice') != null && $localstorage.get('TotalPrice') != undefined && $localstorage.get('TotalPrice') != '') {
                //     var OrderTotal = $localstorage.get('TotalPrice');
                // }
                // if (parseInt(OrderTotal) < parseInt($rootScope.OrderLimit)) {
                //     $scope.model.OrderAmount = parseInt(OrderTotal).toFixed(2);
                //     $scope.model.ShippingCharge = parseInt($rootScope.ShippingCharge).toFixed(2);
                //     $scope.model.OrderTotal = parseInt($scope.model.OrderAmount) + parseInt($rootScope.ShippingCharge);
                //     $scope.model.OrderTotal = parseInt($scope.model.OrderTotal).toFixed(2);
                // } else {
                //     $scope.model.OrderAmount = parseInt(OrderTotal).toFixed(2);
                //     $scope.model.OrderTotal = parseInt(OrderTotal).toFixed(2);
                //     $scope.model.ShippingCharge = 0;

                // }
                // $scope.DisplayData();
                $scope.CreateOrder();
            }


        }
    }

    $scope.TotalFunction = function() {
        var OrderTotal = 0;
        if ($localstorage.get('TotalPrice') != null && $localstorage.get('TotalPrice') != undefined && $localstorage.get('TotalPrice') != '') {
            var OrderTotal = $localstorage.get('TotalPrice');
        }
        if (parseInt(OrderTotal) < parseInt($rootScope.OrderLimit)) {
            $scope.model.OrderAmount = parseInt(OrderTotal).toFixed(2);
            $scope.model.ShippingCharge = parseInt($rootScope.ShippingCharge).toFixed(2);
            $scope.model.OrderTotal = parseInt($scope.model.OrderAmount) + parseInt($rootScope.ShippingCharge);
            $scope.model.OrderTotal = parseInt($scope.model.OrderTotal).toFixed(2);
        } else {
            $scope.model.OrderAmount = parseInt(OrderTotal).toFixed(2);
            $scope.model.OrderTotal = parseInt(OrderTotal).toFixed(2);
            $scope.model.ShippingCharge = 0;

        }
        $scope.DisplayData();
    }

    $scope.DisplayData = function() {
        var OrderList = [];
        if ($localstorage.get('UserProduct') != null && $localstorage.get('UserProduct') != undefined && $localstorage.get('UserProduct') != '') {
            OrderList = JSON.parse($localstorage.get('UserProduct'));
        }
        var ProductList = [];
        for (var i = 0; i < OrderList.length; i++) {
            var ObjOrderDetail = {
                ProductId: OrderList[i].ProductId,
                ProductName: OrderList[i].p_info.Name,
                Qty: parseFloat(OrderList[i].Qty) > 1 ? (parseFloat(OrderList[i].Qty).toFixed(1) * 1000 / 1000).toString() : parseInt(OrderList[i].Qty * 1000).toString(),
                Price: OrderList[i].Price,
                Attributes: OrderList[i].Attribute == "Nos" ? "Nos" : parseFloat(OrderList[i].Qty) < 1 ? "Gram" : "KG",
                ProductImage: OrderList[i].p_info.FileName,
            }
            ProductList.push(ObjOrderDetail);
        }
        $scope.DisplayYourOrder = {
                ProductList: ProductList,
                OrderAmount: $scope.model.OrderAmount,
                ShippingCharge: $scope.model.ShippingCharge,
                GrandTotal: $scope.model.OrderTotal,
                Address: $scope.model.Address
            }
            // $scope.DisplayOrderSummary = true;
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

    $scope.GoToCart = function() {
            $scope.init();
        }
        // $scope.InitCheckOut();

    $scope.init();

})