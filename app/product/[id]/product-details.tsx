'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, ShieldCheck, ThumbsUp, Eye, Share2, MessageSquare, Play } from 'lucide-react'
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { CheckoutButton } from './checkout-button'
import { LoginForm } from './login-form'
import { VideoPlayer } from './video-player'

export function ProductDetails({ product, isAdmin = false, user, hasAccess = false }: { product: any, isAdmin?: boolean, user?: any, hasAccess?: boolean }) {
    // If plans exist, default to the first one, otherwise null
    const [selectedPlan, setSelectedPlan] = useState<any>(
        (product.plans && product.plans.length > 0) ? product.plans[0] : null
    )

    // Current price is either the selected plan price or the product base price
    const currentPrice = selectedPlan ? selectedPlan.price : product.price

    // --- VIDEO LAYOUT (YouTube Style) ---
    if (product.type === 'VIDEO') {
        const primaryMedia = product.media.length > 0 ? product.media[0] : null

        return (
            <div className="min-h-screen bg-[#0f0f0f] text-white font-sans">
                {/* Navigation Bar Placeholder (if global nav isn't enough) */}
                <div className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-white/10 px-6 py-3 flex items-center justify-between">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </Button>
                    </Link>

                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-green-500 uppercase tracking-widest border border-green-900 bg-green-900/20 px-2 py-1 rounded">
                                Admin Logado
                            </span>
                        </div>
                    )}

                    {!isAdmin && (
                        <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-3 py-1 border border-zinc-800 rounded-full">
                            Modo Cinema
                        </div>
                    )}
                </div>

                <div className="max-w-[1800px] mx-auto px-4 lg:px-6 py-6 transition-all">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

                        {/* LEFT COLUMN: Main Video & Content */}
                        <div className="space-y-4">
                            {/* Video Player / Thumbnail Container */}
                            {/* Video Player / Thumbnail Container */}
                            <VideoPlayer product={product} hasAccess={hasAccess || isAdmin} />

                            {/* Video Title & Title Stats */}
                            <div className="space-y-3">
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white line-clamp-2">
                                    {product.name}
                                </h1>

                                <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-zinc-800">
                                    <div className="flex items-center gap-4 text-sm text-zinc-400 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Eye className="w-4 h-4" /> {product.fakeViews || product.views || 0} visualizações
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                        <span>{product.fakeDate || 'Há 2 dias'}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-white gap-2 h-9 px-4">
                                            <ThumbsUp className="w-4 h-4" /> {product.likes || 12}
                                            <span className="w-[1px] h-4 bg-zinc-600 mx-1 opacity-30"></span>
                                            <span className="text-xs opacity-50">Gostei</span>
                                        </Button>
                                        <Button variant="secondary" size="sm" className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-white gap-2 h-9 px-4">
                                            <Share2 className="w-4 h-4" /> Compartilhar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Author/Channel Description Box */}
                            <div className="bg-[#1f1f1f] rounded-xl p-4 gap-4 hover:bg-[#252525] transition-colors cursor-pointer">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-purple-800 flex-shrink-0" />
                                    <div className="flex flex-col flex-1">
                                        <h3 className="font-bold text-white text-base">{product.manualAuthor || 'Canal Oficial'}</h3>
                                        <p className="text-xs text-zinc-400">145 mil inscritos</p>

                                        <div className="mt-3 text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                                            {product.description}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Gallery Section with Carousel */}
                            {/* Gallery Section Removed */}

                            {/* Comments Placeholder REMOVED */}
                        </div>

                        {/* RIGHT COLUMN: Sticky Sidebar Actions */}
                        <div className="lg:sticky lg:top-24 space-y-4">

                            {/* Admin Controls */}
                            {isAdmin && (
                                <div className="bg-zinc-900 border border-green-900/50 rounded-xl p-4 mb-4 shadow-lg ring-1 ring-green-500/20">
                                    <h4 className="text-green-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Painel Admin
                                    </h4>
                                    <div className="flex flex-col gap-2">
                                        <Link href={`/product/${product.id}?watch=1`}>
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                                                <Play className="w-4 h-4 mr-2" /> Assistir Vídeo
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Purchase Card */}
                            <div id="checkout-area" className="bg-[#1f1f1f] border border-zinc-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                <div className="relative z-10 space-y-6">
                                    <div>
                                        <p className="text-zinc-400 text-xs uppercase font-bold tracking-widest mb-1">Acesso Completo</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-bold text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice / 100)}
                                            </span>
                                            <span className="text-sm text-zinc-500 mb-1 line-through">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((currentPrice * 1.5) / 100)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Plans Selection */}
                                    {product.plans && product.plans.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-500 uppercase">Escolha o plano:</label>
                                            <div className="flex flex-col gap-2">
                                                {product.plans.map((plan: any) => (
                                                    <div
                                                        key={plan.id}
                                                        onClick={() => setSelectedPlan(plan)}
                                                        className={`cursor-pointer px-3 py-2 rounded-lg border text-sm flex justify-between items-center transition-all ${selectedPlan.id === plan.id
                                                            ? 'bg-red-600/20 border-red-500 text-white'
                                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                                                            }`}
                                                    >
                                                        <span className="font-bold">{plan.name}</span>
                                                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price / 100)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <CheckoutButton
                                        product={product}
                                        selectedPrice={currentPrice}
                                        selectedPlan={selectedPlan}
                                        user={user}
                                    />

                                    <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-lg">
                                        <p className="text-blue-200 text-xs text-center flex flex-col gap-1">
                                            <span className="font-bold">Já comprou este vídeo?</span>
                                            <span className="opacity-80">Faça login para assistir agora.</span>
                                        </p>
                                        <div className="mt-2">
                                            <LoginForm productId={product.id} />
                                        </div>
                                    </div>

                                    {/* Features Removed */}
                                </div>
                            </div>

                            {/* Recommended / Upsell Area (Placeholder) */}
                            <div className="flex flex-col gap-3">
                                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">Relacionados</h4>
                                <div className="bg-[#1f1f1f] p-3 rounded-lg flex gap-3 hover:bg-[#252525] cursor-pointer transition-colors opacity-60 hover:opacity-100">
                                    <div className="w-24 h-16 bg-zinc-800 rounded-md flex-shrink-0" />
                                    <div className="flex flex-col justify-center">
                                        <span className="text-sm text-white font-bold leading-tight line-clamp-2">Pacote Completo: Todos os Vídeos</span>
                                        <span className="text-xs text-zinc-500 mt-1">R$ 97,00</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- STANDARD LAYOUT (Group/Digital Product) ---
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
            <div className="container mx-auto px-6 py-12">

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Link href="/">
                        <Button variant="ghost" className="mb-8 p-0 text-zinc-500 hover:text-white hover:bg-transparent uppercase tracking-widest text-xs flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar
                        </Button>
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* Media Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="relative"
                    >
                        {/* Decorative Elements */}
                        <div className="absolute -inset-4 bg-gradient-to-tr from-red-600/20 to-transparent rounded-[2rem] blur-2xl -z-10" />

                        <Carousel className="w-full relative z-10" opts={{ loop: true }}>
                            <CarouselContent>
                                {product.media.map((item: any) => (
                                    <CarouselItem key={item.id}>
                                        <div className="aspect-square relative rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl border border-white/5">
                                            {item.type === 'IMAGE' ? (
                                                <img src={item.url} alt="Produto" className="w-full h-full object-cover" />
                                            ) : (
                                                <video
                                                    src={item.url}
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                    className="w-full h-full object-contain bg-black"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLVideoElement;
                                                        target.style.display = 'none';
                                                        target.parentElement?.insertAdjacentHTML('beforeend', '<div class="absolute inset-0 flex items-center justify-center text-red-500 text-xs px-2 text-center">Erro ao carregar vídeo. Verifique formato/permissão.</div>');
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {product.media.length > 1 && (
                                <>
                                    <CarouselPrevious className="left-4 bg-black/50 border-0 text-white hover:bg-red-600 backdrop-blur-sm" />
                                    <CarouselNext className="right-4 bg-black/50 border-0 text-white hover:bg-red-600 backdrop-blur-sm" />
                                </>
                            )}
                        </Carousel>
                    </motion.div>

                    {/* Info Section */}
                    <div className="space-y-8">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-block px-3 py-1 mb-4 border border-green-500/30 rounded-full bg-green-900/10"
                            >
                                <span className="text-xs font-bold uppercase tracking-widest text-green-500 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Disponível Agora
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none"
                            >
                                {product.name}
                            </motion.h1>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="prose prose-invert text-zinc-400 font-light text-lg leading-relaxed border-l-2 border-red-600 pl-6"
                        >
                            <p className="whitespace-pre-wrap">{product.description}</p>
                        </motion.div>

                        {/* Benefits List */}
                        <motion.ul
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="space-y-3"
                        >
                            <li className="flex items-center gap-3 text-zinc-300">
                                <Check className="w-5 h-5 text-red-600" />
                                <span>Acesso Imediato</span>
                            </li>
                            <li className="flex items-center gap-3 text-zinc-300">
                                <Check className="w-5 h-5 text-red-600" />
                                <span>Suporte Prioritário</span>
                            </li>
                            <li className="flex items-center gap-3 text-zinc-300">
                                <Check className="w-5 h-5 text-red-600" />
                                <span>Grupo Exclusivo</span>
                            </li>
                        </motion.ul>

                        {/* Plans Selection */}
                        {product.plans && product.plans.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                className="space-y-4"
                            >
                                <label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Escolha o seu plano:</label>
                                <div className="grid gap-3">
                                    {product.plans.map((plan: any) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group ${selectedPlan.id === plan.id
                                                ? 'bg-red-600/10 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan.id === plan.id ? 'border-red-600' : 'border-zinc-600'
                                                    }`}>
                                                    {selectedPlan.id === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                                                </div>
                                                <span className={`font-bold uppercase tracking-wide ${selectedPlan.id === plan.id ? 'text-white' : 'text-zinc-400'}`}>
                                                    {plan.name}
                                                </span>
                                            </div>
                                            <span className="font-bold text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price / 100)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Sticky Action Box */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-600/20 transition-colors" />

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
                                <div>
                                    <span className="block text-zinc-500 text-sm uppercase tracking-widest font-bold mb-1">Preço Atual</span>
                                    <span className="block text-5xl font-black text-white tracking-tighter">
                                        <span className="text-green-500 text-6xl">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentPrice / 100)}
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <CheckoutButton
                                    product={product}
                                    selectedPrice={currentPrice}
                                    selectedPlan={selectedPlan}
                                    user={user}
                                />
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-zinc-600 text-xs uppercase tracking-widest font-bold">
                                <ShieldCheck className="w-4 h-4" />
                                Checkout Seguro SSL
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}

