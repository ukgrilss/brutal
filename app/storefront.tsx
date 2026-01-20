'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOut, User as UserIcon, ShoppingBag, Menu, X, ChevronRight, Check, Zap, Play, MoreVertical } from 'lucide-react'
import { userLogout } from './auth/actions'

interface Category {
    id: string;
    name: string;
    imageUrl?: string | null;
}

interface Banner {
    id: string;
    imageUrl: string;
    title?: string | null;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string | null;
    media: { type: string, url: string }[];
    plans?: { id: string, name: string, price: number }[];
    type: string;
    fakeViews?: string | null;
    fakeDate?: string | null;
    manualAuthor?: string | null;
}

export function Storefront({
    products,
    categories,
    storeName,
    banners,
    heroMode,
    heroTitle,
    heroDescription,
    showHeroButton,
    heroButtonText,
    heroButtonUrl,
    user
}: {
    products: Product[],
    categories: Category[],
    storeName: string,
    banners: Banner[],
    heroMode: string,
    heroTitle?: string,
    heroDescription?: string,
    showHeroButton?: boolean,
    heroButtonText?: string,
    heroButtonUrl?: string,
    user?: any
}) {
    // Default to the first category if available, otherwise empty string (shows nothing or handles empty state)
    // User wants strict categorization, so no "All" view by default unless explicitly asked.
    // If we want to show *something* initially, picking the first category is safest.
    const [selectedCategory, setSelectedCategory] = useState<string>(categories.length > 0 ? categories[0].id : '')
    const [currentBanner, setCurrentBanner] = useState(0)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    // Auto-rotate banners
    if (banners.length > 0) {
        setTimeout(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length)
        }, 5000)
    }

    const filteredProducts = products.filter(p => p.categoryId === selectedCategory)

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-black/95 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-tighter uppercase text-white flex items-center gap-1">
                        {storeName}
                        <span className="text-red-600">.</span>
                    </h1>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    className="relative h-8 w-8 rounded-full overflow-hidden border border-white/10 p-0"
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                >
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                        alt={user.name}
                                        className="h-full w-full object-cover"
                                    />
                                </Button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-md shadow-lg py-1 z-50">
                                        <div className="px-4 py-3 border-b border-zinc-800">
                                            <p className="text-sm font-medium text-white">{user.name}</p>
                                            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                                        </div>
                                        <Link href="/my-orders" className="flex items-center px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors" onClick={() => setUserMenuOpen(false)}>
                                            <ShoppingBag className="mr-2 h-4 w-4" />
                                            Minhas Compras
                                        </Link>
                                        {user.id === 'admin' && (
                                            <Link href="/bobao/dashboard" className="flex items-center px-4 py-2 text-sm text-yellow-500 hover:bg-zinc-900 hover:text-yellow-400 transition-colors" onClick={() => setUserMenuOpen(false)}>
                                                <Menu className="mr-2 h-4 w-4" />
                                                Painel Admin
                                            </Link>
                                        )}
                                        <div className="border-t border-zinc-800 my-1"></div>
                                        <button
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-500 hover:bg-zinc-900 transition-colors cursor-pointer"
                                            onClick={() => userLogout()}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/auth/login">
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white h-8 text-sm">Entrar</Button>
                                </Link>
                                <Link href="/auth/register">
                                    <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full h-8 text-xs px-4">Criar Conta</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 pt-24 pb-20">

                {/* Hero Section (Banners) - Restored */}
                {heroMode !== 'none' && (
                    <section className={`mb-12 md:mb-24 relative w-full flex items-center justify-center overflow-hidden group transition-all duration-500
                        ${heroMode === 'text_only'
                            ? 'min-h-[250px] md:min-h-0 md:aspect-[32/10] md:rounded-[2.5rem] md:shadow-2xl md:border md:border-white/5 md:bg-zinc-950'
                            : 'aspect-[32/10] rounded-xl md:rounded-[2.5rem] shadow-2xl border border-white/5 bg-zinc-950'
                        }`}
                    >
                        <AnimatePresence mode='wait'>
                            {banners.length > 0 && heroMode !== 'text_only' ? (
                                <motion.div
                                    key={currentBanner}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute inset-0 z-0 flex items-center justify-center"
                                >
                                    <div
                                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-125"
                                        style={{ backgroundImage: `url(${banners[currentBanner].imageUrl})` }}
                                    />
                                    <img
                                        src={banners[currentBanner].imageUrl}
                                        className="relative w-full h-full object-contain z-10"
                                        alt="Banner"
                                    />
                                    {heroMode === 'full' && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-20" />
                                    )}
                                </motion.div>
                            ) : (
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] bg-red-600/10 rounded-full blur-[100px] pointer-events-none md:blur-[150px]" />
                                </div>
                            )}
                        </AnimatePresence>

                        {heroMode === 'full' || heroMode === 'text_only' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative z-30 text-center px-4 max-w-4xl mx-auto"
                            >
                                <h2 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.9] text-white drop-shadow-xl">
                                    {heroTitle ? heroTitle : (banners.length > 0 && banners[currentBanner]?.title) ? banners[currentBanner].title : (
                                        <>Acesso <span className="text-red-600 inline-block">Surreal</span></>
                                    )}
                                </h2>
                                <p className="mt-6 md:mt-8 text-lg md:text-2xl text-zinc-300 font-light max-w-sm md:max-w-xl mx-auto leading-relaxed">
                                    {heroDescription || "Conteúdo de elite para quem busca o extraordinário."}
                                </p>
                                {(showHeroButton && (!banners.length || heroMode === 'text_only' || heroMode === 'full')) && (
                                    <div className="mt-6 md:mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                                        <Button
                                            size="lg"
                                            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                            className="rounded-full px-8 py-6 text-lg bg-red-600 hover:bg-red-700 hover:scale-105 transition-all w-auto md:w-auto shadow-[0_0_30px_rgba(220,38,38,0.3)] cursor-pointer"
                                        >
                                            {heroButtonText || "Ver Produtos"}
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        ) : null}
                    </section>
                )}


                {/* Categories Filter - Carousel with Animated Arrow - RESTORED CARDS */}
                {categories.length > 0 && (
                    <div className="relative mb-12 group/carousel">
                        {/* Scroll Container */}
                        <div className="overflow-x-auto pb-4 scrollbar-hide px-4">
                            <div className="flex gap-4 min-w-max">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`relative w-40 h-60 rounded-2xl overflow-hidden border transition-all group flex-shrink-0 ${selectedCategory === cat.id ? 'border-red-600 ring-2 ring-red-600/50' : 'border-zinc-800 hover:border-zinc-600'}`}
                                    >
                                        {cat.imageUrl ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                                                style={{ backgroundImage: `url(${cat.imageUrl})` }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-zinc-900 group-hover:scale-110 transition-transform duration-500" />
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all" />

                                        <div className="absolute bottom-0 left-0 w-full p-4 text-left">
                                            <span className="block text-white font-bold uppercase tracking-wider text-lg leading-tight break-words drop-shadow-md">
                                                {cat.name}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Animated Arrow Indicator - Right Side - Subtle */}
                        <div className="absolute top-1/2 -translate-y-1/2 right-2 pointer-events-none z-20">
                            <ChevronRight className="w-8 h-8 text-white/30 animate-pulse drop-shadow-lg opacity-50" />
                        </div>
                    </div>
                )}


                {/* Product Grid */}
                <div id="products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                    <AnimatePresence>
                        {filteredProducts.map((product) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                key={product.id}
                                className="group"
                            >
                                <Link href={`/product/${product.id}`} className="block">

                                    {/* CONDITIONAL LAYOUT BASED ON TYPE */}
                                    {product.type === 'VIDEO' ? (
                                        // YOUTUBE STYLE CARD
                                        <div className="flex flex-col gap-3 cursor-pointer">
                                            {/* Thumbnail */}
                                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 ring-0 ring-transparent group-hover:ring-0">
                                                {product.media && product.media.length > 0 ? (
                                                    product.media[0].type === 'IMAGE' ? (
                                                        <img
                                                            src={product.media[0].url}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <video
                                                            src={product.media[0].url}
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            loop // Optional: loop preview on hover could be cool
                                                            playsInline
                                                        />
                                                    )
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                                        <Play className="w-12 h-12 text-zinc-700" />
                                                    </div>
                                                )}
                                                {/* Duration Badge (Fake for now) */}
                                                <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                                                    12:45
                                                </div>
                                            </div>

                                            {/* Meta Info */}
                                            <div className="flex gap-3 items-start pr-4">
                                                {/* Channel Avatar */}
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex-shrink-0 mt-0.5" />

                                                <div className="flex flex-col">
                                                    <h3 className="text-[15px] font-semibold text-white leading-snug line-clamp-2 mb-1 group-hover:text-white">
                                                        {product.name}
                                                    </h3>
                                                    <div className="text-[13px] text-zinc-400 flex flex-col leading-tight">
                                                        <span>{product.manualAuthor || storeName}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span>{product.fakeViews || '10k'} visualizações</span>
                                                            <span className="text-[10px]">•</span>
                                                            <span>{product.fakeDate || 'há 2 dias'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="ml-auto">
                                                    <MoreVertical className="w-5 h-5 text-transparent group-hover:text-white transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // ORIGINAL "GRUPO" / PRODUCT CARD STYLE (Vertical)
                                        <div className="flex flex-col bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-all duration-300 shadow-xl h-full">
                                            {/* Image Container */}
                                            <div className="relative w-full aspect-[4/5] bg-black overflow-hidden bg-[url('/noise.png')]">
                                                <div className="absolute top-2 right-2 z-20 px-2 py-1 rounded bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
                                                    <span className="text-green-500">GRUPO</span>
                                                </div>

                                                {product.media && product.media.length > 0 ? (
                                                    <img
                                                        src={product.media[0].url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
                                                        <span className="text-zinc-800 font-black text-4xl uppercase">?</span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-zinc-950 to-transparent" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 px-5 pb-6 pt-2 flex flex-col bg-zinc-950">
                                                <h3 className="text-lg font-bold leading-tight mb-2 text-white group-hover:text-zinc-300 transition-colors line-clamp-2 min-h-[3.5rem]">
                                                    {product.name}
                                                </h3>
                                                <p className="text-sm text-zinc-400 line-clamp-2 mb-4 h-10 leading-tight">
                                                    {product.description}
                                                </p>

                                                <div className="mt-auto flex items-end justify-between border-t border-dashed border-zinc-800 pt-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">A partir de:</span>
                                                        <span className="text-xl font-bold text-[#FFD700]">
                                                            {product.plans && product.plans.length > 0
                                                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.min(...product.plans.map(p => p.price)))
                                                                : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 w-full">
                                                    <div className="w-full py-2.5 rounded border border-[#FFD700]/30 text-[#FFD700] text-sm font-bold uppercase tracking-wider text-center group-hover:bg-[#FFD700] group-hover:text-black transition-all">
                                                        Ver Detalhes
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-white/5 mt-8">
                        <div className="mx-auto w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <ShoppingBag className="w-8 h-8 text-zinc-500" />
                        </div>
                        <p className="text-zinc-400 text-lg font-medium">Nenhum produto encontrado.</p>
                        <p className="text-zinc-600 text-sm mt-1">Tente mudar a categoria ou volte mais tarde.</p>
                    </div>
                )}

            </main>

            <footer className="border-t border-white/5 bg-zinc-950 py-12 mt-20">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-xl font-black tracking-tighter uppercase text-white mb-4">
                        {storeName}
                        <span className="text-red-600">.</span>
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        &copy; {new Date().getFullYear()} Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}
