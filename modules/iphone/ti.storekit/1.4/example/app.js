/*
 Learn the basics of Storekit with this example.

 Before we can do anything in our app, we need to set up iTunesConnect! This process can be a little painful, but I will
 guide you through it so you don't have to figure it out on your own.

 Follow these steps:

 1) Log in to your Apple Developer account at https://itunesconnect.apple.com/
 2) Click "Manage Your Applications".
 3) If you have already set up your app, click on its icon. If not, click "Add New App" and set up your app.
 4) Click "Manage In-App Purchases".
 5) Click "Create New".
 6) Click "Select" beneath "Non-Consumable".
 7) In "Reference Name" type "Soda Pop", and in "Product ID" type "DigitalSodaPop".
 8) Click "Add Language", and fill out all of the fields. (What you enter here isn't important to this example.)
 9) Select a Price Tier, and upload a Screenshot. For testing purposes, using your app's splash screen is easiest.
 10) Click "Save".
 11) Click "Create New" again, and this time click "Select" beneath "Auto-Renewable Subscriptions".
 12) Click "Create New Family" and fill out all of the required fields.
 13) When asked, enter "MonthlySodaPop" for the Product ID, and save the product.

 iTunesConnect is now set up with at least two products with the IDs "DigitalSodaPop" and "MonthlySodaPop".

 Now we're ready to use Storekit in our app. We're going to do 5 different activities:

 1) Checking if the user can make purchases.
 2) Tracking what the user has purchased in the past.
 3) Buying a single item.
 4) Buying a subscription.
 5) Restoring past purchases.

 Look at the JavaScript below to understand how we do each of these.
 
 Then, when you are ready to test the app, follow these steps:
 
 1) Storekit works in two different environments: "Live" and "Sandbox". It automatically uses the "Sandbox" when you
    run your app in Xcode. This means that "Deploy to Device" in Titanium Studio will connect to the "Live" environment!
    Using a test account in "Live" will ruin the test account. And paying for items with a live account will quickly
    suck up your hard earned cash. So be careful!
 2) Log in to your Apple Developer account at https://itunesconnect.apple.com/
 3) Click "Manage Users" and create a "Test User".
 4) Run your app in the simulator from Titanium Studio at least once.
 5) In your app's directory, open up the build/iphone/yourProject.xcodeproj in Xcode.
 6) In the top left of Xcode, change the "Scheme" to target your device.
 7) Hit "Run" to test the Storekit module in the sandbox!

 */

var Storekit = require('ti.storekit');

var win = Ti.UI.createWindow({
    backgroundColor: '#fff'
});

/*
 We want to show the user when we're communicating with the server, so let's define two simple
 functions that interact with an activity indicator.
 */
var loading = Ti.UI.createActivityIndicator({
    bottom: 10, height: 50, width: 50,
    backgroundColor: 'black', borderRadius: 10,
    style: Ti.UI.iPhone.ActivityIndicatorStyle.BIG
});
var loadingCount = 0;
function showLoading() {
    loadingCount += 1;
    if (loadingCount == 1) {
        loading.show();
    }
}
function hideLoading() {
    loadingCount -= 1;
    if (loadingCount == 0) {
        loading.hide();
    }
}
win.add(loading);

/*
 Now let's define a couple utility functions. We'll use these throughout the app.
 */

/**
 * Keeps track (internally) of purchased products.
 * @param identifier The identifier of the Ti.Storekit.Product that was purchased.
 */
function markProductAsPurchased(identifier) {
    Ti.App.Properties.setBool('Purchased-' + identifier, true);
}

/**
 * Checks if a product has been purchased in the past, based on our internal memory.
 * @param identifier The identifier of the Ti.Storekit.Product that was purchased.
 */
function checkIfProductPurchased(identifier) {
    return Ti.App.Properties.getBool('Purchased-' + identifier, false);
}

/**
 * Requests a product. Use this to get the information you have set up in iTunesConnect, like the localized name and
 * price for the current user.
 * @param identifier The identifier of the product, as specified in iTunesConnect.
 * @param success A callback function.
 * @return A Ti.Storekit.Product.
 */
function requestProduct(identifier, success) {
    showLoading();
    Storekit.requestProducts([identifier], function (evt) {
        hideLoading();
        if (!evt.success) {
            alert('ERROR: We failed to talk to Apple!');
        }
        else if (evt.invalid) {
            alert('ERROR: We requested an invalid product!');
        }
        else {
            success(evt.products[0]);
        }
    });
}

/**
 * Purchases a product.
 * @param product A Ti.Storekit.Product (hint: use Storekit.requestProducts to get one of these!).
 */
function purchaseProduct(product) {
    showLoading();
    Storekit.purchase(product, function (evt) {
        hideLoading();
        switch (evt.state) {
            case Storekit.FAILED:
                alert('ERROR: Buying failed!');
                break;
            case Storekit.PURCHASED:
            case Storekit.RESTORED:
                alert('Thanks!');
                markProductAsPurchased(product.identifier);
                break;
        }
    });
}

/**
 * Restores any purchases that the current user has made in the past, but we have lost memory of.
 */
function restorePurchases() {
    showLoading();
    Storekit.restoreCompletedTransactions();
}
Storekit.addEventListener('restoredCompletedTransactions', function (evt) {
    hideLoading();
    if (evt.error) {
        alert(evt.error);
    }
    else if (evt.transactions == null || evt.transactions.length == 0) {
        alert('There were no purchases to restore!');
    }
    else {
        for (var i = 0; i < evt.transactions.length; i++) {
            markProductAsPurchased(evt.transactions[i].identifier);
        }
        alert('Restored ' + evt.transactions.length + ' purchases!');
    }
});

/*
 1) Can the user make payments? Their device may be locked down, or this may be a simulator.
 */
if (!Storekit.canMakePayments)
    alert('This device cannot make purchases!');
else {

    /*
     2) Tracking what the user has purchased in the past.
     */
    var whatHaveIPurchased = Ti.UI.createButton({
        title: 'What Have I Purchased?',
        top: 10, left: 5, right: 5, height: 40
    });
    whatHaveIPurchased.addEventListener('click', function () {
        alert({
            'Single Item': checkIfProductPurchased('DigitalSodaPop') ? 'Purchased!' : 'Not Yet',
            'Subscription': checkIfProductPurchased('MonthlySodaPop') ? 'Purchased!' : 'Not Yet'
        });
    });
    win.add(whatHaveIPurchased);

    /*
     3) Buying a single item.
     */
    requestProduct('DigitalSodaPop', function (product) {
        var buySingleItem = Ti.UI.createButton({
            title: 'Buy ' + product.title + ', ' + product.formattedPrice,
            top: 60, left: 5, right: 5, height: 40
        });
        buySingleItem.addEventListener('click', function () {
            purchaseProduct(product);
        });
        win.add(buySingleItem);
    });

    /*
     4) Buying a subscription.
     */
    requestProduct('MonthlySodaPop', function (product) {
        var buySubscription = Ti.UI.createButton({
            title: 'Buy ' + product.title + ', ' + product.formattedPrice,
            top: 110, left: 5, right: 5, height: 40
        });
        buySubscription.addEventListener('click', function () {
            purchaseProduct(product);
        });
        win.add(buySubscription);
    });

    /*
     5) Restoring past purchases.
     */
    var restoreCompletedTransactions = Ti.UI.createButton({
        title: 'Restore Lost Purchases',
        top: 160, left: 5, right: 5, height: 40
    });
    restoreCompletedTransactions.addEventListener('click', function () {
        restorePurchases();
    });
    win.add(restoreCompletedTransactions);
}

win.open();