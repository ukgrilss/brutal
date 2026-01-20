import { getStoreConfig } from '../../actions'
import { SettingsForm } from './settings-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default async function SettingsPage() {
    const config = await getStoreConfig()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Configurações da Loja</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Integração e Segurança</CardTitle>
                    <CardDescription>Gerencie o nome da loja, chaves de pagamento e acesso.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SettingsForm config={config} />
                </CardContent>
            </Card>
        </div>
    )
}
