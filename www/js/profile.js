app.controller('ProfileCtrl', function ($scope, $ionicModal, $ionicPopup, $timeout, $ionicLoading, $localstorage, $rootScope, $http, $ionicHistory, $state) {
    $scope.init = function () {
        $scope.ResetModel();
        $scope.GetUserInfo();
        $scope.stars = [];
        $scope.tabs = {
            selectedIndex: 0
        }

        // $scope.ChangeTab();
    }

    //next-prev

    $scope.next = function () {
        $scope.tabs.selectedIndex = $scope.tabs.selectedIndex + 1;
        if ($scope.tabs.selectedIndex > 1) {
            $scope.tabs.selectedIndex = 0;
        }
        if ($scope.tabs.selectedIndex == 1) {
            $scope.ChangeTab();
        } else {
            $scope.GetUserInfo();
        }
    }

    $scope.previous = function () {
        $scope.tabs.selectedIndex = $scope.tabs.selectedIndex - 1;
        if ($scope.tabs.selectedIndex < 0) {
            $scope.tabs.selectedIndex = 0;
        }
        if ($scope.tabs.selectedIndex == 1) {
            $scope.ChangeTab();
        } else {
            $scope.GetUserInfo();
        }
    }
    //profile
    $scope.GetUserInfo = function () {
        $rootScope.Loading();
        var params = {
            UserId: $localstorage.get("UserId"),
        }

        $http.get(Api_Url + 'app_common/GetUserInformationByUserId', { params: params }).success(function (data) {
            if (data.success) {
                for (var o in $scope.model) {
                    $scope.model[o] = data.data[o]
                }
            }
            $scope.GetAllBillingAddressByUser();
            $rootScope.HideLoading();
        })
    }

    $scope.UpdateProfile = function (o) {
        o.UserId = $localstorage.get("UserId");
        $http.post(Api_Url + "app_common/UpdateUserInfo", o).success(function (data) {
            $rootScope.HideLoading();
            if (data.success == true) {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Success',
                    template: data.message,
                    cssClass: 'custPop success',
                    buttons: [{
                        text: 'Ok',
                        type: 'cBtn cBtn-success',
                    }]
                });
                $scope.GetUserInfo();
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
            };
        });
    }
    $scope.GetAllBillingAddressByUser = function () {
        var params = {
            UserId: $localstorage.get("UserId"),
        }
        $http.get(Api_Url + 'app_common/GetAllBillingAddressByUser', { params: params }).success(function (data) {
            if (data.success) {
                console.log(data)
                $scope.lstBillAddress = data.data;
                // $scope.model.SelectedAddress = $scope.lstBillAddress.id;
                $scope.model.Address = $scope.lstBillAddress.Address1;
                // $scope.model.Email = $scope.lstBillAddress.Email;
                // $scope.model.PhoneNo = $scope.lstBillAddress.PhoneNo;
                // $scope.model.FirstName = $scope.lstBillAddress.FirstName;
                // $scope.model.Pincode = $scope.lstBillAddress.PostCode;
                // $scope.model.idArea = $scope.lstBillAddress.idArea;
                // $scope.model.idLandmark = $scope.lstBillAddress.idLandmark;
            } else {
                $scope.lstBillAddress = [];
                // $scope.ChangeAddress('New');
            }
        })
    }

    $scope.ResetModel = function () {
        $scope.model = {
            phone: '',
            Address: '',
            ProfileName: '',
            email: '',
        }
    }


    //Order Info
    $scope.ChangeTab = function () {
        $scope.page = 0;
        $scope.noMoreOrderAvailable = false;
        $scope.lstOrder = [];
        $scope.GetAllCustomerOrder($scope.page);
    }

    $scope.GetAllCustomerOrder = function (page) {
        $rootScope.Loading();
        var param = {
            page: page,
            Limit: 10,
            idUser: $localstorage.get("UserId")
        }
        $http.get(Api_Url + 'app_common/GetAllOrderByUser', { params: param }).success(function (data) {
            if (data.success) {
                $rootScope.HideLoading();
                _.each(data.response, function (i) {
                    i.OrderSubtotalInclTax = parseFloat(i.OrderSubtotalInclTax).toFixed(2);
                })
                $scope.lstOrder.push.apply($scope.lstOrder, data.response);
                if (data.response.length <= 0) {
                    $scope.noMoreOrderAvailable = true;
                }
                $scope.page = $scope.page + 1;
            } else {
                $rootScope.HideLoading();
            }
        });

    }

    $scope.loadMore = function () {
        $timeout(function () {
            if ($scope.noMoreOrderAvailable != true) {
                $scope.GetAllCustomerOrder($scope.page);
            }
            $scope.$apply(function () {
                $timeout(function () {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, 1000);
            });
        }, 1000);
    }

    $scope.GoToOrderDetail = function (o) {
        var OrderTotal = o.OrderSubtotalInclTax - o.OrderShippingInclTax;
        var objDetail = {
            idOrder: o.id,
            OrderStatusId: o.OrderStatusId,
            BillNo: o.PurchaseOrderNumber,
            OrderTotal: parseFloat(OrderTotal).toFixed(2),
            ShippingCharge: parseFloat(o.OrderShippingInclTax).toFixed(2),
            GrandTotal: parseFloat(o.OrderSubtotalInclTax).toFixed(2),
            PaymentMethod: o.PaymentMethodSystemName,
            ShippingAddress: o.tblbillingaddress != null && o.tblbillingaddress.Address1 != null && o.tblbillingaddress.Address1 != undefined && o.tblbillingaddress.Address1 != '' ? o.tblbillingaddress.Address1 : o.ShippAddress1,
            productDetail: [],
            Email: o.tblbillingaddress.Email,
            Area: o.tblbillingaddress.tblarea != null ? o.tblbillingaddress.tblarea.Name : '',
            Landmark: o.tblbillingaddress.tbllandmark != null ? o.tblbillingaddress.tbllandmark.Name : '',
        }
        for (var i = 0; i < o.tblorderitems.length; i++) {
            var objproduct = o.tblorderitems[i];
            if (objproduct.product.product_picture_mappings.length > 0) {
                var fileName = Api_Url + "MediaUploads/" + objproduct.product.product_picture_mappings[0].tblmediamgmt.FileName;
            } else {
                var fileName = "http://103.232.124.169:50000/MediaUploads/no-item-img-found.png";
            }
            var obj = {
                ProductName: objproduct.product.Name,
                fileName: fileName,
                Price: parseFloat(objproduct.PriceInclTax).toFixed(2),
                Qty: objproduct.Attribute == "Nos" ? objproduct.Quantity : objproduct.Quantity < 1 ? objproduct.Quantity * 1000 : objproduct.Quantity,
                DisplayQty: objproduct.Attribute == "Nos" ? "Nos" : parseFloat(objproduct.Quantity) < 1 ? "Gram" : "KG",
            }
            objDetail.productDetail.push(obj);
        }
        //console.log(objDetail)
        $scope.lstOrderDetail = objDetail;
        ShowModel();

    }

    function ShowModel() {
        $ionicModal.fromTemplateUrl('my-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalOrderDetail = modal;
            $scope.modalOrderDetail.show();
        });
    }

    $scope.closeFeedbackModal = function () {
        $scope.modalOrderDetail.hide();
    }

    //cancelled Order
    $scope.CancelledOrderByCustomer = function (idOrder) {
        // $scope.closeModal();
        var confirmPopup = $ionicPopup.confirm({
            title: 'Cancel Order',
            template: "Are you sure want to delete this order",
            cssClass: 'custPop warning',
            buttons: [{
                text: 'Cancel',
                type: 'cBtn cBtn-warning',
                onTap: function (e) {
                    return false;
                }

            }, {
                text: 'ok',
                type: 'cBtn cBtn-warning',
                onTap: function (e) {
                    return true;

                }
            }]
        });
        confirmPopup.then(function (res) {
            if (res) {
                var params = {
                    idOrder: idOrder,
                    idOrderStatus: 4,
                }
                $http.get(Api_Url + 'app_common/CancelledOrderByCustomer', { params: params }).success(function (data) {
                    $rootScope.HideLoading();
                    if (data.success) {
                        var confirmPopupSuccess = $ionicPopup.confirm({
                            title: 'success',
                            template: data.message,
                            cssClass: 'custPop success',
                            buttons: [{
                                text: 'Ok',
                                type: 'cBtn cBtn-success',
                                onTap: function (e) {
                                    return true;
                                }
                            }],

                        });
                        confirmPopupSuccess.then(function (res) {
                            $scope.closeModal();
                            $scope.ChangeTab();
                        })
                    } else {
                        var confirmPopupError = $ionicPopup.confirm({
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

    /** request modal starts */
    $scope.showRequestModal = function () {
        $ionicModal.fromTemplateUrl('request.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalRequest = modal;
            $scope.modalRequest.show();
        });
    }

    $scope.closeRequestModal = function () {
        $scope.modalRequest.hide();
    }

    $scope.SaveRequest = function (form, model) {
        if (form.$invalid) {
            return;
        } else {
            $rootScope.Loading();
            var params = {
                Request: model.request,
                UserId: $localstorage.get("UserId"),
            }
            $http.post(Api_Url + 'request/SaveRequest', params).success(function (response) {
                $rootScope.HideLoading();
                if (response.success) {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Successful',
                        template: response.message,
                        cssClass: 'custPop success',
                        buttons: [{
                            text: 'Done',
                            type: 'cBtn cBtn-success',
                            onTap: function(e) {
                                return true;
                            }
                        }]
                    });
                    confirmPopup.then(function (){
                        $scope.closeRequestModal();
                    });
                } else {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Error',
                        template: response.message,
                        cssClass: 'custPop error',
                        buttons: [{
                            text: 'Ok',
                            type: 'cBtn cBtn-error',
                            onTap: function(e) {
                                return true;
                            }
                        }]
                    });
                };
            });
        }
    }
    /** request modal ends */

    /** feedback modal starts */
    $scope.showFeedbackModal = function () {
        $ionicModal.fromTemplateUrl('feedback.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.modalFeedback = modal;
            $scope.ratingValue = 0;
            $scope.modalFeedback.show();
            $scope.updateRatings();
        });
    }

    $scope.closeFeedbackModal = function () {
        $scope.modalFeedback.hide();
    }

    $scope.updateRatings = function () {
        $scope.stars = [];
        for (var i = 0; i < 5; i++) {
            $scope.stars.push({
                filled: i < $scope.ratingValue
            });
        }
    }

    $scope.selectedRating = function (index) {
        $scope.ratingValue = index + 1;
        $scope.updateRatings();
    }

    $scope.SaveFeedback = function (feedbackForm, model) {
        if (feedbackForm.$invalid || $scope.ratingValue == 0) {
            return;
        } else {
            $rootScope.Loading();
            var params = {
                Rate: $scope.ratingValue,
                Review: model.feedback,
                UserId: $localstorage.get("UserId"),
            }

            $http.post(Api_Url + 'feedback/SaveFeedback', params).success(function (data) {
                $rootScope.HideLoading();
                if (data.success) {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Successful',
                        template: data.message,
                        cssClass: 'custPop success',
                        buttons: [{
                            text: 'Done',
                            type: 'cBtn cBtn-success',
                            onTap: function(e) {
                                return true;
                            }
                        }]
                    });
                    confirmPopup.then(function () {
                        $scope.closeFeedbackModal();
                    })
                } else {
                    var confirmPopup = $ionicPopup.confirm({
                        title: 'Error',
                        template: data.message,
                        cssClass: 'custPop error',
                        buttons: [{
                            text: 'Ok',
                            type: 'cBtn cBtn-error',
                            onTap: function(e) {
                                return true;
                            }
                        }]
                    });
                };
            });
        }
    }
    /** feedback modal ends */

    $scope.init();
});