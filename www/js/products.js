app.controller('ProductsCtrl', function($scope, $http, $ionicModal, $timeout, $localstorage, $ionicLoading, $state, $rootScope, $ionicPopup) {
    $scope.Init = function() {
        $scope.Lst_GlobalProduct = [];
        if ($localstorage.get('UserProduct') != '' && $localstorage.get('UserProduct') != null && $localstorage.get('UserProduct') != undefined) {
            $scope.Lst_GlobalProduct = JSON.parse($localstorage.get('UserProduct'));
        }
        $scope.TotalPrice = 0;
        $scope.noMoreProductAvailable = false;
        $scope.GetAllCategory();
        $scope.page = 0;
        $scope.LstCat_Product = [];
        $scope.CategoryId = 0;
        $scope.CategoriesName = '';
        $scope.tabs = {
            selectedIndex: '',
        }
    }

    //categoryList 
    $scope.GetAllCategory = function() {
        $http.get(Api_Url + "app_common/GetAllCategory").success(function(resCat) {
            $scope.LstCategories = resCat.Categories;
            if ($scope.LstCategories.length > 0) {
                $rootScope.Loading();
                $scope.CategoriesName = $scope.LstCategories[0].Title;
                $scope.CategoryId = $scope.LstCategories[0].id;
                $scope.GetProductsByCategory($scope.LstCategories[0].id, $scope.LstCategories[0].Title, $scope.page);
                $scope.tabs.selectedIndex = 0;
                if ($scope.LstCategories.length <= '2') {
                    $scope.tabsWidth = true;
                } else {
                    $scope.tabsWidth = false;
                }
            }
        });
    }

    //next prev button
    $scope.next = function(index) {
        $scope.tabs.selectedIndex = $scope.tabs.selectedIndex + 1;
        if ($scope.tabs.selectedIndex >= $scope.LstCategories.length) {
            $scope.tabs.selectedIndex = 0;
        }
        $scope.ChangeCategory($scope.LstCategories[$scope.tabs.selectedIndex].id, $scope.LstCategories[$scope.tabs.selectedIndex].Title);
    }

    $scope.previous = function(index) {
        $scope.tabs.selectedIndex = $scope.tabs.selectedIndex - 1;
        if ($scope.tabs.selectedIndex < 0) {
            $scope.tabs.selectedIndex = $scope.LstCategories.length;
        }
        $scope.ChangeCategory($scope.LstCategories[$scope.tabs.selectedIndex].id, $scope.LstCategories[$scope.tabs.selectedIndex].Title);
    }

    //when change category
    $scope.ChangeCategory = function(CategoryId, CategoriesName) {
        $rootScope.Loading();
        $scope.noMoreProductAvailable = false;
        $scope.page = 0;
        $scope.CategoriesName = CategoriesName;
        $scope.CategoryId = CategoryId;
        $scope.LstCat_Product = [];
        $scope.GetProductsByCategory(CategoryId, CategoriesName, $scope.page)
    }

    $scope.loadMore = function(CategoryId, CategoriesName) {
        $timeout(function() {
            if ($scope.noMoreProductAvailable != true) {
                $scope.GetProductsByCategory(CategoryId, CategoriesName, $scope.page);
            }
            $scope.$apply(function() {
                $timeout(function() {
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                }, 1000);
            });
        }, 1500);
    }

    //GetAllProductCategorywise with 10 
    $scope.GetProductsByCategory = function(CategoryId, CategoriesName, page) {
        var params = {
            CategoryId: CategoryId,
            page: page,
            Limit: 10,
        }
        $http.get(Api_Url + 'app_common/GetProductsByCategory', {
            params: params
        }).success(function(resProducts) {
            if (resProducts.success == true) {
                $scope.noMoreProductAvailable = false;
                var LstCat_Product_10 = resProducts.products;
                if (LstCat_Product_10.length == 0) {
                    $scope.noMoreProductAvailable = true;
                } else {
                    var TotalRecord = resProducts.TotalProduct;
                    var CId = LstCat_Product_10[0].p_info.product_category_mappings[0].CategoryId;
                    if (CId == $scope.CategoryId) {
                        for (var i = 0; i < LstCat_Product_10.length; i++) {
                            var obj = _.findWhere($scope.Lst_GlobalProduct, {
                                ProductId: LstCat_Product_10[i].p_info.Id
                            });
                            if (!obj) {
                                var objProduct_Attr = LstCat_Product_10[i].P_Attributes;
                                var objProduct = LstCat_Product_10[i].p_info;
                                if (objProduct.product_picture_mappings.length > 0) {
                                    objProduct.FileName = Api_Url + "MediaUploads/" + objProduct.product_picture_mappings[0].tblmediamgmt.FileName;
                                } else {
                                    objProduct.FileName = "http://103.232.124.169:50000/MediaUploads/no-item-img-found.png";
                                }
                                if (LstCat_Product_10[i].P_Attributes[0]?.productattributevalues?.length > 0) {
                                    LstCat_Product_10[i].Attribute = LstCat_Product_10[i].P_Attributes[0].Attribute.Name;
                                    LstCat_Product_10[i].AttributeQty = LstCat_Product_10[i].Attribute == "Nos" ? LstCat_Product_10[i].P_Attributes[0].productattributevalues[0].Quantity : LstCat_Product_10[i].P_Attributes[0].productattributevalues[0].WeightAdjustment;
                                    LstCat_Product_10[i].KgPrice = LstCat_Product_10[i].P_Attributes[0].productattributevalues[0].PriceAdjustment;
                                    LstCat_Product_10[i].AttributePrice = 0;
                                    LstCat_Product_10[i].DisplayPrice = LstCat_Product_10[i].Attribute == "Nos" ? Math.round((LstCat_Product_10[i].KgPrice / LstCat_Product_10[i].P_Attributes[0].productattributevalues[0].Quantity).toFixed(2) * 100) / 100 : LstCat_Product_10[i].KgPrice;
                                    LstCat_Product_10[i].MinimumAttrQty = parseFloat(LstCat_Product_10[i].AttributeQty).toFixed(3);
                                    LstCat_Product_10[i].AttributeValue = LstCat_Product_10[i].P_Attributes[0].productattributevalues[0].Quantity;
                                } else {
                                    LstCat_Product_10[i].Attribute = '-';
                                    LstCat_Product_10[i].AttributeQty = 0;
                                    LstCat_Product_10[i].AttributePrice = 0;
                                    LstCat_Product_10[i].KgPrice = 0;
                                    LstCat_Product_10[i].AttributeValue = 0;
                                    LstCat_Product_10[i].MinimumAttrQty = 0;
                                    LstCat_Product_10[i].DisplayPrice = 0;
                                }
                                LstCat_Product_10[i].MaximumStock = LstCat_Product_10[i].Attribute == "Nos" ? 20 : 20;
                                LstCat_Product_10[i].Weight = LstCat_Product_10[i].Attribute == "Nos" ? "1-Nos" : "1-KG";
                                LstCat_Product_10[i].Product_Weight = 0;
                                LstCat_Product_10[i].DisplayWeight = LstCat_Product_10[i].Attribute == "Nos" ? "Nos" : "Gram";
                                LstCat_Product_10[i].Price = 0;
                                LstCat_Product_10[i].Qty = 0;
                                LstCat_Product_10[i].ProductId = objProduct.Id;

                            } else {
                                //when Price Change or StockChange Update LocalStorage Price
                                LstCat_Product_10[i] = obj;
                            }
                        }
                        $scope.LstCat_Product.push.apply($scope.LstCat_Product, LstCat_Product_10);
                        if ($scope.Lst_GlobalProduct.length > 0) {
                            $scope.ManageTotalPrice();
                        }
                        $scope.page = $scope.page + 1;
                    }
                }
                $rootScope.HideLoading();
            } else {
                $scope.LstCat_Product = [];
                $scope.noMoreProductAvailable = true;
                $rootScope.HideLoading();
            }

        });

    }


    //Add To Cart Functionality
    $scope.AddProduct = function(item, flg) {
        try {
            var audio = new Audio(Api_Url + "MediaUploads/button-click.mp3");
            audio.play();
        } catch (ex) {

        }
        if (item.P_Attributes[0]?.productattributevalues?.length > 0) {
            if (item.P_Attributes[0].Attribute.Name != 'Nos') {
                // Add or Remove Qty
                // if (flg != 'Add') {
                //     if (item.Qty == item.MinimumAttrQty) {
                //         item.Qty = 0;
                //         item.AttributeQty = 0;
                //     }
                // }
                if (flg == 'Add') {
                    // item.Qty = parseFloat(item.Qty + item.AttributeQty);
                    item.Qty = Math.round((item.Qty + item.AttributeQty) * 1e12) / 1e12;
                } else {
                    // item.Qty = parseFloat(item.Qty - item.AttributeQty);
                    item.Qty = Math.round((item.Qty - item.AttributeQty) * 1e12) / 1e12;
                }
                //display Weight
                item.DisplayWeight = item.Qty < 1 ? "Gram" : "KG";

                //Manage Attributes price
                // if (flg == 'Add') {
                //     if (item.Qty >= 0.5 && item.Qty < 5) {
                //         item.AttributeQty = 0.5;
                //     } else if (item.Qty >= 5 && item.Qty < 20) {
                //         item.AttributeQty = 1;
                //     } else if (item.Qty >= 20) {
                //         item.AttributeQty = 5;
                //     } else if (item.Qty <= 0.5) {
                //         item.AttributeQty = item.MinimumAttrQty;
                //     }
                // } else {

                //     if (item.Qty > 0.5 && item.Qty < 5) {
                //         item.AttributeQty = 0.5;
                //     } else if (item.Qty >= 5 && item.Qty < 20) {
                //         item.AttributeQty = 1;
                //     } else if (item.Qty >= 20) {
                //         item.AttributeQty = 5;
                //     } else if (item.Qty <= 0.5) {
                //         item.AttributeQty = item.MinimumAttrQty;
                //     }

                // }
                //Display weight
                if (item.Qty < 1) {
                    item.Product_Weight = parseInt(item.Qty * 1000).toString();
                } else {
                    item.Product_Weight = (parseFloat(item.Qty) * 1000 / 1000).toString();
                }
                item.AttributePrice = parseFloat(item.Qty * item.KgPrice).toFixed(2);
                item.Price = parseFloat(Math.round(item.AttributePrice * 100) / 100).toFixed(2);
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
                item.Price = parseFloat(Math.round(item.Price * 100) / 100).toFixed(2);
            }
            //save LocalStrorage
            var objfindProduct = _.findWhere($scope.Lst_GlobalProduct, {
                ProductId: item.p_info.Id,
            });
            if (!objfindProduct) {
                $scope.Lst_GlobalProduct.push(item);
            } else {
                objfindProduct = item;
            }
            if (item.Qty == 0 && item.Price == 0) {
                if ($scope.Lst_GlobalProduct.length > 0) {
                    $scope.Lst_GlobalProduct = _.filter($scope.Lst_GlobalProduct, function(data) {
                        if (data.ProductId != item.p_info.Id) {
                            return data;
                        }
                    })
                }
            }
            $localstorage.set('UserProduct', JSON.stringify($scope.Lst_GlobalProduct));
            //save Total
            $scope.ManageTotalPrice();
        }
    }


    //Total Price Sum Calculation
    $scope.ManageTotalPrice = function() {
        $scope.TotalPrice = 0;

        _.each($scope.Lst_GlobalProduct, function(item) {
            $scope.TotalPrice = $scope.TotalPrice + parseFloat(item.Price);
        })
        $scope.TotalPrice = parseFloat($scope.TotalPrice).toFixed(2);
        $localstorage.set('TotalPrice', $scope.TotalPrice);
    }


    //redirect to cart page
    $scope.GoToCart = function() {
            if ($scope.Lst_GlobalProduct.length > 0) {
                $state.go('app.cart');
            } else {
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Empty Cart',
                    template: "You does not select any product..",
                    cssClass: 'custPop info',
                    buttons: [{
                        text: 'Ok',
                        type: 'cBtn cBtn-info',
                    }]
                });
            }
        }
        //init
    $scope.Init();


    $scope.opendescription = function(o) {

        if (o.p_info.FullDescription != null && o.p_info.FullDescription != '') {
            $ionicModal.fromTemplateUrl('product-image-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modalimage = modal;
                $scope.modalimage.show();
            });

            $scope.p_info = {
                Name: o.p_info.Name,
                FileName: o.p_info.FileName,
                FullDescription: o.p_info.FullDescription
            }

        }

    }
    $scope.closeModal = function() {
        $scope.modalimage.hide();
    };
});