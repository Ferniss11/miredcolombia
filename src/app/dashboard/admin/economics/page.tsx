
import EconomicsClient from './EconomicsClient';
import { getPlatformAiCostsAction, getPlatformConfigAction } from '@/lib/platform-actions';

export default async function EconomicsPage() {
    const platformCosts = await getPlatformAiCostsAction();
    const platformConfig = await getPlatformConfigAction();

    return <EconomicsClient initialCosts={platformCosts} initialConfig={platformConfig} />;
}
