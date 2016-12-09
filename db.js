//基本の設定
var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.mozIDBKeyRange || window.msIDBKeyRange;
var IDBCursor = window.IDBCursor || window.webkitIDBCursor;
var db;
//indexedDB.deleteDatabase("kakeibo");
function opendb() {
    var req = indexedDB.open("kakeibo", 1);
    
    req.onupgradeneeded = function (event) {
        var db = event.target.result;
        var shopsStore = db.createObjectStore("shops", {keyPath: "id", autoIncrement: true});
        var categoriesStore = db.createObjectStore("categories", {keyPath: "id", autoIncrement: true});
        var columnsStore = db.createObjectStore("columns", {keyPath: "id", autoIncrement: true});

        columnsStore.createIndex('date', 'date', { unique: false });
        columnsStore.createIndex('sh', ['shop', 'date'], { unique: false });
        columnsStore.createIndex('ca', ['category', 'date'], { unique: false });
        columnsStore.createIndex('sp', ['hasSpecial', 'date'], { unique: false });
        columnsStore.createIndex('shsp', ['shop', 'hasSpecial', 'date'], { unique: false });
        columnsStore.createIndex('casp', ['category', 'hasSpecial', 'date'], { unique: false });
        columnsStore.createIndex('shca', ['shop', 'category', 'date'], { unique: false });
        columnsStore.createIndex('shcasp', ['shop', 'category', 'hasSpecial', 'date'], { unique: false });

    };
    return new Promise(function (resolve,reject){
        req.onsuccess = function (event) {
            db = this.result;
            /*var transaction = db.transaction(["shops", "categories", "columns"], "readwrite");

            var columnsStore = transaction.objectStore("columns");

            columnsStore.openCursor().onsuccess = function (event) {
               var cursor = event.target.result;
               if (cursor) {
                   console.log(cursor.value);
                   cursor.continue();
               }
           };*/
            resolve(db);
        };
        req.onerror = function (event) {
        reject("error");
    };
    })
}
function addToDb (table, data) {
    var transaction = db.transaction(table, 'readwrite');
    var store = transaction.objectStore(table);
    var req = store.add(data);
    req.onsuccess = function (event) {
        console.log('登録成功。');
    };
    req.onerror = function (event) {
        console.log('登録失敗:' + event.message);
    };
}

function deleteFromDb (table, key) {
    var transaction = db.transaction(table, 'readwrite');
    var store = transaction.objectStore(table);
    var req = store.delete(parseInt(key));
    req.onsuccess = function (event) {
        console.log('削除成功。');
    };
    req.onerror = function (event) {
        console.log('削除失敗:' + event.message);
    };
}

function prepareSelect () {
    var transaction = db.transaction(["shops", "categories"], 'readonly');
    var shopsStore = transaction.objectStore("shops");
    var categoriesStore = transaction.objectStore("categories");
    var shops = [];
    shopsStore.openCursor().onsuccess = function (event) {
       var cursor = event.target.result;
       if (cursor) {
           shops.push({'key': cursor.value.id,'value':cursor.value.shop});
           cursor.continue();
       }
   };
    var categories = [];
    categoriesStore.openCursor().onsuccess = function (event) {
        var cursor = event.target.result;
        if(cursor){
            categories.push({'key': cursor.value.id,'value':cursor.value.category});
            cursor.continue();
        }
    }
    var data = {'shops': shops, 'categories': categories};
    return data;
}

function getColumns (conds) {
    var iname = '';
    var lower = [];
    var upper = [];
    if(conds.shop){
        iname += 'sh';
        lower.push(conds.shop);
        upper.push(conds.shop);
    }
    if(conds.category){
        iname += 'ca';
        lower.push(conds.category);
        upper.push(conds.category);
       }
    if(conds.hasSpecial){
        iname += 'sp';
        lower.push('×');
        upper.push('×');
    }
    if(iname === ''){
        iname = 'date';
        lower = Date.parse(conds.datest);
        upper = Date.parse(conds.dateed);
    }else{
        lower.push(Date.parse(conds.datest));
        upper.push(Date.parse(conds.dateed));
    }
    var transaction = db.transaction('columns', 'readonly');
    var columnsStore = transaction.objectStore('columns');
    var index = columnsStore.index(iname);
    var range = IDBKeyRange.bound(lower, upper);
    return new Promise(function (resolve,reject){
        var columns = [];
        index.openCursor(range).onsuccess = function (event){
            if(event.target.result == null) {
                resolve(columns);
                return;
            }
            var cursor = event.target.result;
            columns.push(cursor.value);
            cursor.continue();
        };
    });
}

function getItems(target, data){
    var isDate = false,
        values = [],
        items = [];
    if(target === 'date'){
        isDate = true;
    }
    data.forEach(function (e) {  
        var value;
        if(isDate){
            var date = new Date(e.date);
            var year = date.getFullYear(); 
            var month = date.getMonth() + 1;
            value = year + '/' + month;
        }else{
            value = e[target];
        }
        if (values.indexOf(value) === -1) {    
            values.push(value);
        }
    });
    values.forEach(function (value){
        var sumCost = 0;
        if(isDate){
                var ym = value.split('/');
                var first = new Date(ym[0], ym[1] - 1, 1);
                var last = new Date(ym[0], ym[1], 0, 23, 59, 59);
        }
        data.forEach(function (datum) {   
            if(datum[target] == value){
                sumCost += parseInt(datum.cost); 
            }else if(isDate && Date.parse(first) <= datum.date && datum.date <= Date.parse(last)){
                sumCost += parseInt(datum.cost);
            }    
        })
        items.push({
            item: value,
            cost: sumCost
        });
    })
    return items;
}