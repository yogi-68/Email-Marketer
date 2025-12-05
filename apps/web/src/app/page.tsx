import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="fade-in">
          <h1>
            Email Marketing
            <br />
            <span className="text-gradient">Powered by AI</span>
          </h1>
          <p className={styles.subtitle}>
            Leverage Send Time Optimization and automated warmup to achieve 35% higher open rates.
            Built on AWS SES with 30x cost advantage over traditional ESPs.
          </p>
          <div className={styles.cta}>
            <Link href="/signup" className="btn btn-primary">
              Start Free Trial
            </Link>
            <Link href="#pricing" className="btn btn-secondary">
              See Pricing
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className={`${styles.stats} fade-in`}>
          <div className="glass-card">
            <h3>$0.115</h3>
            <p>Cost per 1,000 emails</p>
          </div>
          <div className="glass-card">
            <h3>35%</h3>
            <p>Higher open rates with STO</p>
          </div>
          <div className="glass-card">
            <h3>99.9%</h3>
            <p>Uptime guarantee</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <h2 className="text-center mb-xl">Proprietary AI Features</h2>

        <div className="grid grid-2">
          <div className="glass-card">
            <div className={styles.featureIcon}>🎯</div>
            <h3>Send Time Optimization</h3>
            <p>
              ML-powered prediction engine analyzes individual engagement patterns
              to deliver each email at the perfect moment for maximum opens and clicks.
            </p>
            <div className={styles.badge}>Premium Feature</div>
          </div>

          <div className="glass-card">
            <div className={styles.featureIcon}>🛡️</div>
            <h3>Automated Warmup Guardian</h3>
            <p>
              Progressive IP warming system that gradually increases sending volume
              over 45 days, protecting your reputation and ensuring deliverability.
            </p>
            <div className={styles.badge}>Included</div>
          </div>

          <div className="glass-card">
            <div className={styles.featureIcon}>🤖</div>
            <h3>LLM Content Generation</h3>
            <p>
              AI-powered personalization creates hyper-targeted subject lines and
              email copy that resonates with each individual recipient.
            </p>
            <div className={styles.badge}>Premium Feature</div>
          </div>

          <div className="glass-card">
            <div className={styles.featureIcon}>📊</div>
            <h3>Real-time Reputation Monitoring</h3>
            <p>
              Continuous tracking of bounce rates, complaint rates, and deliverability
              metrics with automatic sending pause on threshold violations.
            </p>
            <div className={styles.badge}>Included</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricing}>
        <h2 className="text-center mb-xl">Performance-Based Pricing</h2>

        <div className="grid grid-3">
          <div className="glass-card">
            <h3>Essentials</h3>
            <div className={styles.price}>
              <span className={styles.priceAmount}>$49</span>
              <span className={styles.pricePeriod}>/month</span>
            </div>
            <ul className={styles.pricingFeatures}>
              <li>✓ 50,000 emails/month</li>
              <li>✓ Automated warmup</li>
              <li>✓ Basic analytics</li>
              <li>✓ API access</li>
              <li>✗ Send Time Optimization</li>
              <li>✗ LLM content generation</li>
            </ul>
            <Link href="/signup" className="btn btn-secondary">Get Started</Link>
          </div>

          <div className={`glass-card ${styles.featuredPlan}`}>
            <div className={styles.popularBadge}>Most Popular</div>
            <h3>Premium</h3>
            <div className={styles.price}>
              <span className={styles.priceAmount}>$149</span>
              <span className={styles.pricePeriod}>/month</span>
            </div>
            <ul className={styles.pricingFeatures}>
              <li>✓ 200,000 emails/month</li>
              <li>✓ Everything in Essentials</li>
              <li>✓ <strong>Send Time Optimization</strong></li>
              <li>✓ <strong>LLM content generation</strong></li>
              <li>✓ Advanced analytics</li>
              <li>✓ Priority support</li>
            </ul>
            <Link href="/signup" className="btn btn-primary">Start Free Trial</Link>
          </div>

          <div className="glass-card">
            <h3>Enterprise</h3>
            <div className={styles.price}>
              <span className={styles.priceAmount}>Custom</span>
            </div>
            <ul className={styles.pricingFeatures}>
              <li>✓ Unlimited emails</li>
              <li>✓ Everything in Premium</li>
              <li>✓ Dedicated IPs</li>
              <li>✓ Custom warmup schedules</li>
              <li>✓ White-label option</li>
              <li>✓ 24/7 phone support</li>
            </ul>
            <Link href="mailto:sales@emailmarketer.com" className="btn btn-secondary">Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta}>
        <div className="glass-card text-center">
          <h2>Ready to 10x Your Email Performance?</h2>
          <p>
            Join innovative companies leveraging AI-powered email marketing
            at a fraction of traditional ESP costs.
          </p>
          <Link href="/signup" className="btn btn-primary mt-lg">
            Start Your Free 14-Day Trial
          </Link>
          <p className={styles.ctaSubtext}>
            No credit card required • Setup in 5 minutes• Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
