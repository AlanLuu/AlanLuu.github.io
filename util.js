/*
 * Functions to detect mobile devices.
*/
var isMobile = {
    android: function() {
        return navigator.userAgent.match(/(?=.*Android)(?=.*Mobile)/i) !== null;
    },
    blackberry: function() {
        return navigator.userAgent.match(/BlackBerry/i) !== null;
    },
    ios: function() {
        return navigator.userAgent.match(/iPhone|iPod/i) !== null;
    },
    opera: function() {
        return navigator.userAgent.match(/Opera Mini/i) !== null;
    },
    windows: function() {
        return navigator.userAgent.match(/IEMobile/i) !== null || navigator.userAgent.match(/WPDesktop/i) !== null;
    },
    any: function() {
        return isMobile.android() || isMobile.blackberry() || isMobile.ios() || isMobile.opera() || isMobile.windows();
    }
};


/**
 * Asserts that a passed in boolean value is true. If not, throws an error with the passed in error message.
 * 
 * @param bool - the boolean value to test
 * @param message - the error message to display if bool is false.
*/
function assert(bool, message) {
    if (!bool) {
        throw new Error(message || "");
    }
}


/**
 * Returns a new string consisting of the specified substring at the specified index of this string.
 * 
 * @param index - the specified index
 * @param string - the substring to insert
 * @return a new string consisting of the specified substring at the specified index of this string
*/
String.prototype.insertAt = function(index, string) {
    return this.substring(0, index) + string + this.substring(index);
};


/**
 * Removes the element at the specified position in this array and shifts any subsequent elements to the left.
 * 
 * @param index - the index of the element to be removed
 * @return the element that was removed from this array
*/
Array.prototype.removeIndex = function(index) {
    return this.splice(index, 1)[0];
};


/**
 * Removes the first occurrence of the specified element from this array, if it exists.
 * 
 * @param element - the element to be removed from this array, if it exists.
 * @return true if this array contained the specified element
*/
Array.prototype.removeElement = function(element) {
    let i = this.indexOf(element);
    if (i >= 0) {
        this.removeIndex(i);
        return true;
    }
    return false;
};


/**
 * Inserts the specified element at the specified index in this array.
 * 
 * @param index - index at which the specified element is to be inserted
 * @param element - element to be inserted
*/
Array.prototype.addAt = function(index, element) {
    this.splice(index, 0, element);
};


/**
 * Returns true if and only if this array contains the specified element.
 * 
 * @param element - element whose presence in this array is to be tested
 * @return true if and only if this array contains the specified element
*/
Array.prototype.contains = function(element) {
    return this.indexOf(element) >= 0;
};


/**
 * Removes all the elements from this array.
*/
Array.prototype.clear = function() {
    this.length = 0;
};


/**
 * Compares the specified array with this array for equality. Two arrays are said to be equal if and only if 
 * they both have the same length and all corresponding pairs of elements in the two arrays are equal.
 * 
 * @param other - the array to be compared for equality with this array
 * @return true if the specified object is equal to this array
*/
Array.prototype.equals = function(other) {
    if (this.length !== other.length) return false;
    
    var i = this.length;
    while (i--) {
        if (this[i] !== other[i]) return false;
    }
    return true;
};


/**
 * A static version of Array::equals.
 * 
 * @param arr1 - the first array to compare
 * @param arr2 - the second array to compare
 * @return true if arr1 equals arr2
*/
Array.equals = function(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    var i = arr1.length;
    while (i--) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
};

String.prototype.equals = Array.prototype.equals;