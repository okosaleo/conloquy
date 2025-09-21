import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { polarClient } from "@/lib/polar";
import { protectedProcedure, createTRPCRouter} from "@/trpc/init";
import { count, eq } from "drizzle-orm";

export const premiumRouter = createTRPCRouter({
    getCurrentSubscription: protectedProcedure.query(async ({ctx}) => {
        const customer = await polarClient.customers.getStateExternal({
            externalId: ctx.auth.user.id,
        });

        const subscriptions = customer.activeSubscriptions[0];

        if (!subscriptions) {
            return null
        }

        const product = await polarClient.products.get({id: subscriptions.productId});

        return product
    }),
    // get all products that are not archived and are recurring, sorted by price amount ascending
    getProducts: protectedProcedure.query(async () => {
        const products = await polarClient.products.list({
            isArchived: false,
            isRecurring: true,
            sorting: ["price_amount"]
        });

        return products.result.items;
   }),
    getFreeUsage: protectedProcedure.query(async ({ctx}) => {
        const customer = await polarClient.customers.getStateExternal({
            externalId: ctx.auth.user.id,
        });

        const subscriptions = customer.activeSubscriptions[0];

        if (subscriptions) {
            return null
        }

        const [userMeetings] = await db 
        .select({
            count: count(meetings.id),
        })
        .from(meetings)
        .where(eq(meetings.userId, ctx.auth.user.id));

         const [userAgents] = await db 
        .select({
            count: count(agents.id),
        })
        .from(agents)
        .where(eq(agents.userId, ctx.auth.user.id));

        return {
            meetingsCount: userMeetings.count,
            agentCount: userAgents.count
        }
    })
});

