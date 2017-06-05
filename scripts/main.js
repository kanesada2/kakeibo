window.onload = function (){
    opendb().then(function () {
        render();
    })
}
function render() {
    var menu = new Vue({
        el: '#leftmenu',
        data: {
            isHidden1: true,
            isHidden2: true,
            isHidden3: true,
            formenu: prepareSelect()
        },
        watch: {
            soDatest: function (val) {
                maintable.update();
            },
            soDateed: function (val) {
                maintable.update();
            },
            soShop: function (val) {
                maintable.update();
            },
            soCategory: function (val) {
                maintable.update();
            },
            soSpecial: function (val) {
                maintable.update();
            },
            formenu: function (val) {
                maintable.$set('forField', prepareSelect());
                document.getElementById('adShop').value = '';
                document.getElementById('adCategory').value = '';
            }
        },
        computed: {
            defDatest: function () {
                date = new Date();
                date.setDate(1);
                yy = date.getFullYear();
                mm = date.getMonth() + 1;
                dd = date.getDate();
                if(mm < 10){
                    mm = '0' + mm;
                }
                if(dd < 10){
                    dd = '0' + dd;
                }
                return yy + '-' + mm + '-' + dd
            },
            defDateed: function () {
                date = new Date();
                yy = date.getFullYear();
                mm = date.getMonth() + 1;
                dd = date.getDate();
                if(mm < 10){
                    mm = '0' + mm;
                }
                if(dd < 10){
                    dd = '0' + dd;
                }
                return yy + '-' + mm + '-' + dd
            },
            shops: function () {
                shops = this.formenu['shops'];
                return shops;
            },
            categories: function () {
                categories = this.formenu['categories'];
                return categories;
            }
        },
        methods:{
            addShop: function (event) {
                var shop =  {shop: this.adShop};
                addToDb('shops', shop);
                this.$set('formenu',prepareSelect());
                maintable.showToast("追加しました");
            },
            addCategory: function (event) {
                var category =  {category: this.adCategory};
                addToDb('categories', category);
                this.$set('formenu',prepareSelect());
                maintable.showToast("追加しました");
            },
            delShop: function (event){
                deleteFromDb('shops', this.dsval);
                this.$set('formenu',prepareSelect());
                maintable.showToast("削除しました");
            },
            delCategory: function (event){
                deleteFromDb('categories', this.dcval);
                this.$set('formenu',prepareSelect());
                maintable.showToast("削除しました");
            }
    }
    })
    
    var maintable = new Vue({
    el: '#columntable',
    data: {
        writable: true,
        hiddenToast: true,
        forField: menu.$data.formenu,
    },
    computed: {
        defDate: function () {
            return this.formatDate(Date.now(), 'hyphen');
        },
        shops: function () {
                var shops = this.forField['shops'];
                return shops;
            },
        categories: function () {
                var categories = this.forField['categories'];
                return categories;
            }
    },
    methods:{
            addColumn: function (event) {
                if(this.inSpecial){
                    var special = '〇';
                }
                else{
                    var special = '×';
                }
                var column =  {
                    date: Date.parse(this.inDate),
                    shop: this.inShop,
                    category: this.inCategory,
                    cost: this.inCost,
                    hasSpecial: special,
                    note: this.inNote,
                              };
                if(this.inShop === '' | this.inCategory === ''){
                    alert('店名・分類を選択してください');
                    return;
                }
                addToDb('columns', column);
                this.showToast("追加しました");
                this.update();
            },
            deleteColumn: function (id){
                if(window.confirm('本当に削除しますか？')){
                    deleteFromDb('columns', id);
                    this.showToast("削除しました");
                    this.update();
                }
            },
            update: function (event) {
                var conds = {
                    datest: menu.$data.soDatest,
                    dateed: menu.$data.soDateed,
                    shop: menu.$data.soShop,
                    category: menu.$data.soCategory,
                    hasSpecial: menu.$data.soSpecial
                }
                document.getElementById('inDate').value = this.defDate;
                document.getElementById('inShop').selectedIndex = 0;
                document.getElementById('inCategory').selectedIndex = 0;
                document.getElementById('inCost').value = '';
                document.getElementById('inSpecial').checked = false;
                this.inSpecial = false;
                getColumns(conds).then(function (data) {
                    maintable.$set('columns', data);
                    maintable.$set('tmonths', getItems('date',data));
                    maintable.$set('tshops', getItems('shop',data));
                    maintable.$set('tcategories', getItems('category',data));
                });
            },
            formatDate: function(timestamp, val){
                var mode = val || 'slush';
                var date = new Date(timestamp);
                var yy = date.getFullYear();
                var mm = date.getMonth() + 1;
                var dd = date.getDate();
                if(mode == 'slush'){
                    return yy + '/' + mm + '/' + dd;
                }else if(mode == 'hyphen'){
                if(mm < 10){
                    mm = '0' + mm;
                }
                if(dd < 10){
                    dd = '0' + dd;
                }
                    return(yy + '-' + mm + '-' + dd);
                }
            },
            formatCurrency: function (str) {
                var num = new String(str).replace(/,/g, "");
                while(num != (num = num.replace(/^(-?\d+)(\d{3})/, "$1,$2")));
                return num;
            },
            showToast: function (str){
                var toast = document.getElementById("toast");
                document.getElementById("toasttxt").textContent = str;
                toast.classList.add("show");
                window.setTimeout(function(){
                    toast.classList.remove("show");
                }, 2000);
            }
    }
})
}