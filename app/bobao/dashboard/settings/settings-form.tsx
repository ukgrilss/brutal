'use client'

import { useState } from 'react'
import { updateStoreConfig } from '../../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, Save } from 'lucide-react'

interface SettingsFormProps {
    config: any
}

export function SettingsForm({ config }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setShowSuccess(false)

        await updateStoreConfig(formData)

        setIsLoading(false)
        setShowSuccess(true)

        setTimeout(() => setShowSuccess(false), 3000)
    }

    return (
        <>
            <form action={handleSubmit} className="space-y-6 max-w-xl">
                <div className="space-y-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-2">
                        <Label htmlFor="storeName">Nome da Loja</Label>
                        <Input id="storeName" name="storeName" defaultValue={config.storeName} placeholder="Ex: Grupo Premium" className="bg-white dark:bg-zinc-950" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="heroMode">Estilo da Área Superior (Hero)</Label>
                        <select
                            name="heroMode"
                            id="heroMode"
                            defaultValue={config.heroMode || 'full'}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="full">Completo (Banner + Texto)</option>
                            <option value="text_only">Apenas Texto (Sem banner)</option>
                            <option value="banner">Apenas Banners (Sem texto)</option>
                            <option value="none">Desativado (Sem destaque)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="heroTitle">Título Principal (Headline)</Label>
                        <Input id="heroTitle" name="heroTitle" defaultValue={config.heroTitle || ''} placeholder="Ex: Acesso Surreal" className="bg-white dark:bg-zinc-950" />
                        <p className="text-xs text-muted-foreground">Deixe em branco para usar o padrão.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="heroDescription">Subtítulo (Descrição)</Label>
                        <Input id="heroDescription" name="heroDescription" defaultValue={config.heroDescription || ''} placeholder="Ex: Conteúdo de elite para quem busca o extraordinário" className="bg-white dark:bg-zinc-950" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="heroButtonText">Texto do Botão</Label>
                            <Input id="heroButtonText" name="heroButtonText" defaultValue={config.heroButtonText || ''} placeholder="Ex: Ver Produtos" className="bg-white dark:bg-zinc-950" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heroButtonUrl">Link do Botão</Label>
                            <Input id="heroButtonUrl" name="heroButtonUrl" defaultValue={config.heroButtonUrl || ''} placeholder="Ex: #produtos ou https://..." className="bg-white dark:bg-zinc-950" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="showHeroButton"
                            name="showHeroButton"
                            defaultChecked={config.showHeroButton !== false}
                            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                        />
                        <Label htmlFor="showHeroButton" className="mb-0">Mostrar Botão de Ação</Label>
                    </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <h3 className="font-bold text-sm uppercase text-muted-foreground">Credenciais SyncPay</h3>
                    <div className="space-y-2">
                        <Label htmlFor="sincPayKey">Client ID (Chave Pública)</Label>
                        <Input id="sincPayKey" name="sincPayKey" defaultValue={config.sincPayKey || ''} type="text" placeholder="Ex: 53448..." className="bg-white dark:bg-zinc-950 font-mono text-sm" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sincPaySecret">Client Secret (Chave Privada)</Label>
                        <Input id="sincPaySecret" name="sincPaySecret" defaultValue={config.sincPaySecret || ''} type="text" placeholder="Ex: e3be1..." className="bg-white dark:bg-zinc-950 font-mono text-sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">Essas credenciais são usadas para gerar o Pix e consultar pagamentos.</p>
                </div>

                <div className="space-y-4 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="space-y-2">
                        <Label htmlFor="adminPassword">Alterar Senha de Admin</Label>
                        <Input id="adminPassword" name="adminPassword" placeholder="Nova senha se desejar mudar..." type="password" className="bg-white dark:bg-zinc-950" />
                    </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto min-w-[200px] bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </form>

            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-10 right-10 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 font-bold tracking-tight border border-green-500"
                    >
                        <div className="bg-white/20 p-2 rounded-full">
                            <Check className="w-5 h-5" />
                        </div>
                        <div>
                            <p>Sucesso!</p>
                            <p className="text-xs font-normal opacity-90">Suas configurações foram salvas.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
