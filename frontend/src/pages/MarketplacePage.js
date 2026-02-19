import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  ShoppingCart, Package, Search, Plus, Minus, Trash2, 
  CheckCircle, Truck, Star, Tag, ArrowRight, X, ShoppingBag,
  MapPin, CreditCard, QrCode, Loader2, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MarketplacePage = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderComplete, setOrderComplete] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchCart();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/marketplace/products`;
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ product_id: productId, quantity })
      });
      if (response.ok) {
        toast.success('Produto adicionado ao carrinho');
        fetchCart();
      }
    } catch (error) {
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const response = await fetch(`${API_URL}/api/marketplace/cart/${itemId}?quantity=${quantity}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchCart();
      }
    } catch (error) {
      toast.error('Erro ao atualizar carrinho');
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await fetch(`${API_URL}/api/marketplace/cart/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCart();
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const createOrder = async () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      toast.error('Preencha o endereço de entrega');
      return;
    }
    
    setProcessingOrder(true);
    try {
      const response = await fetch(`${API_URL}/api/marketplace/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shipping_address: shippingAddress,
          payment_method: 'pix',
          notes: ''
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrderComplete(data);
        setShowCheckout(false);
        setShowCart(false);
        fetchCart();
        toast.success('Pedido criado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Erro ao criar pedido');
      }
    } catch (error) {
      toast.error('Erro ao processar pedido');
    } finally {
      setProcessingOrder(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatCurrency = (value) => `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const calculateDiscount = (price, marketPrice) => {
    if (!marketPrice || marketPrice <= price) return 0;
    return Math.round((1 - price / marketPrice) * 100);
  };

  const categoryIcons = {
    'Enxoval': '🛏️',
    'Amenities': '✨',
    'Decoração': '🎨',
    'Equipamentos': '📺',
    'Alimentos & Bebidas': '☕',
    'Serviços': '💼'
  };

  return (
    <div className="space-y-6" data-testid="marketplace-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-[#D4AF37]" />
            Marketplace Hestia
          </h1>
          <p className="text-gray-400">Produtos exclusivos para hotéis parceiros</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a1929] border-gray-700 w-64"
              data-testid="search-products"
            />
          </div>
          
          {/* Cart Button */}
          <Button
            onClick={() => setShowCart(true)}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0a1929] relative"
            data-testid="open-cart-btn"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Carrinho
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? "bg-[#D4AF37] text-[#0a1929]" : "border-gray-700 text-gray-300"}
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat.id)}
            className={selectedCategory === cat.id ? "bg-[#D4AF37] text-[#0a1929]" : "border-gray-700 text-gray-300"}
            data-testid={`category-${cat.name}`}
          >
            {categoryIcons[cat.name] || '📦'} {cat.name}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Card className="bg-[#0f2744]/50 border-gray-700/50">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold">Nenhum produto encontrado</p>
            <p className="text-gray-400 mt-2">Tente outra categoria ou termo de busca</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const discount = calculateDiscount(product.price, product.market_price);
            return (
              <Card 
                key={product.id} 
                className="bg-[#0f2744]/50 border-gray-700/50 hover:border-[#D4AF37]/30 transition-all overflow-hidden group"
                data-testid={`product-${product.id}`}
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-800">
                  <img 
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1583845112239-97ef1341b271?w=400'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {discount > 0 && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0">
                      -{discount}%
                    </Badge>
                  )}
                  {product.is_featured && (
                    <Badge className="absolute top-3 right-3 bg-[#D4AF37] text-[#0a1929] border-0">
                      <Star className="w-3 h-3 mr-1" /> Destaque
                    </Badge>
                  )}
                </div>
                
                {/* Content */}
                <CardContent className="p-4">
                  <p className="text-xs text-[#D4AF37] mb-1">{product.marketplace_categories?.name}</p>
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.short_description}</p>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-[#D4AF37]">{formatCurrency(product.price)}</span>
                    {product.market_price > product.price && (
                      <span className="text-sm text-gray-500 line-through">{formatCurrency(product.market_price)}</span>
                    )}
                  </div>
                  
                  {/* Stock */}
                  {product.stock_quantity < 20 && (
                    <p className="text-xs text-amber-400 mb-3">
                      Apenas {product.stock_quantity} em estoque
                    </p>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-700 text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                      onClick={() => setSelectedProduct(product)}
                    >
                      Ver detalhes
                    </Button>
                    <Button
                      onClick={() => addToCart(product.id)}
                      className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0a1929]"
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#0f2744] h-full overflow-y-auto" data-testid="cart-sidebar">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
                  Carrinho ({cartCount})
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </Button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Seu carrinho está vazio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 bg-[#0a1929]/50 rounded-lg">
                        <img 
                          src={item.product?.images?.[0] || 'https://via.placeholder.com/80'} 
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm">{item.product?.name}</h4>
                          <p className="text-[#D4AF37] font-semibold">{formatCurrency(item.product?.price)}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 border-gray-700"
                              onClick={() => updateCartItem(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 border-gray-700"
                              onClick={() => updateCartItem(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-auto text-red-400 hover:text-red-300"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Frete</span>
                      <span className="text-emerald-400">Grátis</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white">
                      <span>Total</span>
                      <span className="text-[#D4AF37]">{formatCurrency(cartTotal)}</span>
                    </div>
                    
                    <Button 
                      className="w-full bg-[#D4AF37] hover:bg-[#C5A028] text-[#0a1929] py-6"
                      data-testid="checkout-btn"
                    >
                      Finalizar Pedido
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-[#0f2744] border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <p className="text-sm text-[#D4AF37]">{selectedProduct.marketplace_categories?.name}</p>
                <CardTitle className="text-white text-xl">{selectedProduct.name}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <img 
                src={selectedProduct.images?.[0] || 'https://images.unsplash.com/photo-1583845112239-97ef1341b271?w=600'} 
                alt={selectedProduct.name}
                className="w-full h-64 object-cover rounded-lg"
              />
              
              <p className="text-gray-300">{selectedProduct.description}</p>
              
              {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                <div className="bg-[#0a1929]/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-3">Especificações</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-500 text-sm capitalize">{key}:</span>
                        <span className="text-white text-sm ml-2">
                          {typeof value === 'object' ? JSON.stringify(value) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedProduct.customization_available && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <Tag className="w-4 h-4" />
                    <span className="font-semibold">Personalização disponível</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Este produto pode ser personalizado com o logo do seu hotel
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div>
                  <span className="text-2xl font-bold text-[#D4AF37]">{formatCurrency(selectedProduct.price)}</span>
                  {selectedProduct.market_price > selectedProduct.price && (
                    <span className="text-gray-500 line-through ml-2">{formatCurrency(selectedProduct.market_price)}</span>
                  )}
                </div>
                <Button 
                  onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}
                  className="bg-[#D4AF37] hover:bg-[#C5A028] text-[#0a1929]"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Adicionar ao Carrinho
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
