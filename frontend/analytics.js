/* PrintLab 3D — Analytics unificado. GA4: reemplazá // ⚠️ REEMPLAZAR: G-XXXXXXXXXX. */
(function(w,d){'use strict';const k='p3d_consent',id=w.PRINT3D_GA_MEASUREMENT_ID||'';const ok=()=>w.localStorage.getItem(k)==='accepted';function loadGA4(){if(!ok()||!id||w.__print3dGA4Loaded)return;w.__print3dGA4Loaded=true;w.dataLayer=w.dataLayer||[];w.gtag=w.gtag||function(){w.dataLayer.push(arguments)};w.gtag('js',new Date());w.gtag('config',id,{send_page_view:false});const s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);d.head.appendChild(s)}function trackPageView(p){loadGA4();if(!ok()||typeof w.gtag!=='function')return;w.gtag('event','page_view',{page_path:p||location.pathname+location.search,page_location:location.href,page_title:d.title})}function trackEvent(n,p){loadGA4();if(ok()&&typeof w.gtag==='function'&&n)w.gtag('event',n,p||{})}function item(i,q){return{item_id:String(i?.productId||i?.id||i?._id||''),item_name:i?.name||'',price:Number(i?.price||0),quantity:Number(q||i?.qty||1)}}function trackViewItem(i){trackEvent('view_item',{currency:'ARS',value:Number(i?.price||0),items:[item(i,1)]})}function trackAddToCart(i,q){trackEvent('add_to_cart',{currency:'ARS',value:Number(i?.price||0)*Number(q||1),items:[item(i,q)]})}function trackBeginCheckout(items,value){trackEvent('begin_checkout',{currency:'ARS',value:Number(value||0),items:Array.isArray(items)?items.map(i=>item(i)):[]})}function trackPurchase(o){if(!o)return;trackEvent('purchase',{transaction_id:String(o.number||o.id||o._id||''),currency:'ARS',value:Number(o.total||0),shipping:Number(o.shipping||0),items:Array.isArray(o.items)?o.items.map(i=>item(i)):[]})}w.Print3DAnalytics={loadGA4,trackPageView,trackEvent,trackPurchase,trackViewItem,trackAddToCart,trackBeginCheckout};if(ok())w.setTimeout(loadGA4,0)})(window,document);
(function(w,d){
  'use strict';
  if(!/\/admin\.html$/.test(w.location.pathname)) return;

  const productListState={
    page:1,
    limit:20,
    total:0,
    search:'',
    category:'all',
    status:'all'
  };

  const normalizeProduct=(p)=>({
    ...p,
    id:String(p.id||p._id||''),
    cat:p.cat||p.category||'',
    desc:p.desc||p.description||'',
    image:p.image||'',
    images:Array.isArray(p.images)?p.images:[],
    active:p.active!==false
  });

  const renderProductTable=(list)=>{
    const view=d.querySelector('#productsView');
    if(!view) return;
    const totalPages=Math.max(1,Math.ceil(productListState.total/productListState.limit));
    if(productListState.page>totalPages) productListState.page=totalPages;

    view.innerHTML=`<div class="section"><div><h2>Productos</h2><p>Administrá el catálogo de Tienda Gemelos 3D</p></div><button class="btn primary" id="newProduct"><i class="fa-solid fa-plus"></i>Nuevo producto</button></div>
      <div class="filters">
        <div class="search"><i class="fa-solid fa-magnifying-glass"></i><input class="input" id="pq" placeholder="Buscar producto..." value="${esc(productListState.search)}"></div>
        <select class="select" id="pc"><option value="all">Todas las categorías</option>${categoryOpts(productListState.category==='all'?'':productListState.category)}</select>
        <select class="select" id="ps"><option value="new">Más nuevos</option><option value="popular">Más populares</option><option value="priceAsc">Precio menor</option><option value="priceDesc">Precio mayor</option><option value="rating">Mejor rating</option></select>
        <select class="select" id="pa"><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select>
        <button class="btn" id="pcClear">Limpiar</button>
      </div>
      <div class="card table-card">
        <div class="scroll"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${list.map(productRow).join('')||'<tr><td colspan="6"><div class="empty"><i class="fa-solid fa-box-open"></i><strong>No hay productos</strong>Probá otros filtros.</div></td></tr>'}</tbody></table></div>
        <div class="pager"><span id="productListInfo"></span><div class="pages" id="productPagination"></div></div>
      </div>`;
    d.querySelector('#ps').value=state.filters.product.sort;
    d.querySelector('#pa').value=productListState.status;
    renderPagination();
    d.querySelector('#newProduct').onclick=()=>productModal();
    d.querySelector('#pq').oninput=()=>{productListState.search=d.querySelector('#pq').value;state.filters.product.q=productListState.search;productListState.page=1;loadProducts()};
    d.querySelector('#pc').onchange=()=>{productListState.category=d.querySelector('#pc').value||'all';state.filters.product.cat=productListState.category==='all'?'':productListState.category;productListState.page=1;loadProducts()};
    d.querySelector('#ps').onchange=()=>{state.filters.product.sort=d.querySelector('#ps').value;productListState.page=1;loadProducts()};
    d.querySelector('#pa').onchange=()=>{productListState.status=d.querySelector('#pa').value||'all';state.filters.product.status=productListState.status==='all'?'':productListState.status;productListState.page=1;loadProducts()};
    d.querySelector('#pcClear').onclick=()=>{state.filters.product={q:'',cat:'',sort:'new',status:''};productListState.search='';productListState.category='all';productListState.status='all';productListState.page=1;loadProducts()};
    d.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>productModal(b.dataset.edit));
    d.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggleProduct(b.dataset.toggle));
    d.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
  };

  const renderPaginationInfo=()=>{
    const info=d.querySelector('#productListInfo');
    if(!info) return;
    if(!productListState.total){info.textContent='Mostrando 0-0 de 0 productos';return;}
    const start=(productListState.page-1)*productListState.limit+1;
    const end=Math.min(productListState.page*productListState.limit,productListState.total);
    info.textContent=`Mostrando ${start}-${end} de ${productListState.total} productos`;
  };

  const renderPagination=()=>{
    const container=d.querySelector('#productPagination');
    if(!container) return;
    const totalPages=Math.ceil(productListState.total/productListState.limit);
    if(totalPages<=1){container.innerHTML='';renderPaginationInfo();return;}
    const page=productListState.page;
    let html=`<button class="page" ${page===1?'disabled':''} data-product-page="${page-1}" aria-label="Página anterior"><i class="fa-solid fa-chevron-left"></i></button>`;
    for(let i=1;i<=totalPages;i++){
      if(i===1||i===totalPages||(i>=page-2&&i<=page+2)){
        html+=`<button class="page ${i===page?'active':''}" data-product-page="${i}">${i}</button>`;
      }else if(i===page-3||i===page+3){
        html+='<span>...</span>';
      }
    }
    html+=`<button class="page" ${page===totalPages?'disabled':''} data-product-page="${page+1}" aria-label="Página siguiente"><i class="fa-solid fa-chevron-right"></i></button>`;
    container.innerHTML=html;
    container.querySelectorAll('[data-product-page]').forEach(b=>b.onclick=()=>goToProductPage(Number(b.dataset.productPage)));
    renderPaginationInfo();
  };

  const goToProductPage=(pageNum)=>{
    const totalPages=Math.max(1,Math.ceil(productListState.total/productListState.limit));
    productListState.page=Math.max(1,Math.min(Number(pageNum)||1,totalPages));
    loadProducts();
    w.scrollTo({top:0,behavior:'smooth'});
  };

  const changeProductLimit=(limit)=>{
    productListState.limit=Math.max(1,Number(limit)||20);
    productListState.page=1;
    loadProducts();
  };

  const loadProducts=async()=>{
    const params=new URLSearchParams({
      page:String(productListState.page),
      limit:String(productListState.limit),
      search:productListState.search,
      category:productListState.category,
      status:productListState.status
    });
    try{
      const data=await api('/admin/products?'+params.toString());
      const incoming=Array.isArray(data?.products)?data.products.map(normalizeProduct):[];
      productListState.total=Number(data?.total)||0;
      products.splice(0,products.length,...incoming);
      renderProductTable(incoming);
    }catch(err){
      toast('error','Error al cargar productos',err?.message||'No se pudo cargar la lista.');
    }
  };

  const deleteProduct=async(id)=>{
    const p=products.find(x=>String(x.id)===String(id));
    const name=p?.name||'este producto';
    confirmModal('Eliminar producto',`Se eliminará ${name}. Esta acción desactiva el producto.`,async()=>{
      try{
        const data=await api('/admin/products/'+encodeURIComponent(id),{method:'DELETE'});
        if(!data?.success) throw Error(data?.message||'Error al eliminar');
        toast('success','Producto eliminado',name);
        const maxPage=Math.max(1,Math.ceil(Math.max(0,productListState.total-1)/productListState.limit));
        if(productListState.page>maxPage) productListState.page=maxPage;
        await loadProducts();
      }catch(err){
        toast('error','Error al eliminar',err?.message||'No se pudo eliminar el producto.');
      }
    });
  };

  w.productListState=productListState;
  w.loadProducts=loadProducts;
  w.renderPagination=renderPagination;
  w.renderPaginationInfo=renderPaginationInfo;
  w.goToProductPage=goToProductPage;
  w.changeProductLimit=changeProductLimit;
  w.renderProductTable=renderProductTable;
  w.deleteProduct=deleteProduct;

  const originalNav=w.nav;
  w.productsView=()=>loadProducts();

  if(typeof originalNav==='function') w.nav=originalNav;

  const originalProductModal=w.productModal;
  const originalToggleProduct=w.toggleProduct;
  void originalProductModal; void originalToggleProduct;

  const run=()=>{
    if(typeof state==='undefined'||!d.querySelector('#productsView')) return;
    productListState.search=state.filters.product.q||'';
    productListState.category=state.filters.product.cat||'all';
    productListState.status=state.filters.product.status||'all';
    loadProducts();
  };

  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',run,{once:true}); else run();
})(window,document);
