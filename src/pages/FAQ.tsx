import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "What is Mr Trend?",
    a: "Mr Trend is a social media marketing platform where you can buy views, followers, likes, and more for platforms like TikTok, Instagram, YouTube, and others.",
  },
  {
    q: "How do I place an order?",
    a: "Navigate to 'New Order', select a platform and service, enter your link and desired quantity, then click 'Place Order'. The cost will be deducted from your balance.",
  },
  {
    q: "How long does delivery take?",
    a: "Most orders start within 0-60 minutes. Delivery speed varies by service, typically 1,000-10,000 per day depending on the service type.",
  },
  {
    q: "How do I add funds?",
    a: "Go to 'Add Funds', enter the amount you want to deposit, select your payment method (Card or Mobile Money via Flutterwave), and complete the payment.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept credit/debit cards and mobile money through Flutterwave. More payment methods coming soon.",
  },
  {
    q: "Is there a refund policy?",
    a: "If an order is not delivered or only partially delivered, the remaining balance will be refunded to your wallet automatically.",
  },
  {
    q: "How does the referral program work?",
    a: "Share your unique referral link. When someone signs up and makes their first deposit, you earn 10% of their deposit as commission.",
  },
  {
    q: "Are the followers/views real?",
    a: "Service quality varies by type. Check the service description for details on quality, speed, and refill guarantees.",
  },
];

const FAQ = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-display">FAQ</h1>
            <p className="text-muted-foreground mt-1">Frequently asked questions</p>
          </div>
        </div>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FAQ;
