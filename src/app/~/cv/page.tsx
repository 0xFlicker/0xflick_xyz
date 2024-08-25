import { Card } from "@/components/Card";
import { Section } from "@/components/Section";
import { SimpleLayout } from "@/components/SimpleLayout";
import clsx from "clsx";
import Link from "next/link";

interface TimeRangeProps {
  start?: string | { label: string; dateTime: string };
  end?: string | { label: string; dateTime: string };
  noHyphen?: boolean;
  className?: string;
}

const TimeRange: React.FC<TimeRangeProps> = ({
  className,
  start,
  end,
  noHyphen,
}) => {
  const startLabel = typeof start === "string" ? start : start?.label;
  const startDate = typeof start === "string" ? start : start?.dateTime;

  const endLabel = typeof end === "string" ? end : end?.label;
  const endDate = typeof end === "string" ? end : end?.dateTime;

  return (
    <div className={clsx(className, "flex flex-row")}>
      {(typeof start !== "undefined" || typeof end !== "undefined") && " "}
      {typeof start !== "undefined" && (
        <>
          <time dateTime={startDate}>{startLabel}</time>{" "}
        </>
      )}
      {!noHyphen &&
        typeof start !== "undefined" &&
        typeof end !== "undefined" && (
          <>
            <span aria-hidden="true">—</span>{" "}
          </>
        )}
      {typeof end !== "undefined" && <time dateTime={endDate}>{endLabel}</time>}
    </div>
  );
};

function ToolsSection({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Section> & {}) {
  return (
    <Section {...props}>
      <ul role="list" className="space-y-16 overflow-visible">
        {children}
      </ul>
    </Section>
  );
}

function Tool({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <Card as="li">
      <Card.Title as="h3" href={href}>
        {title}
      </Card.Title>
      <Card.Description>{children}</Card.Description>
    </Card>
  );
}

const title = "Resume";
const description =
  "Work history and experience. Company names are anonymized, but references can be provided and the names can be revealed on request.";

export const metadata = {
  title,
  description,
};

export default function Resume() {
  return (
    <SimpleLayout title={title} intro={description}>
      <div className="space-y-20">
        <ToolsSection
          id="major-stock-media-provider"
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Major stock media provider
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2015"
                end="2019"
              />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mx-2">
                &
              </p>
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2022"
                end={{
                  label: "Present",
                  dateTime: new Date().getFullYear().toString(),
                }}
              />
            </div>
          }
        >
          <Tool title="Creative Tools">
            Core developer of a variety of online tools for creative
            professionals such as image and video editing, AI, templates, and
            seo.
          </Tool>
          <Tool title="Operations Specialist">
            Creating, managing, upgrading, and debugging the infrastructure that
            powers the company's products. Primary on-call rotation for core
            website issues.
          </Tool>
          <Tool title="Technologies Used">
            Next, React, GraphQL, Typescript, Node, Go, AWS, Docker, Kubernetes,
            Github Actions, Jenkins, New Relic, Sentry
          </Tool>
        </ToolsSection>
        <ToolsSection
          id="startup-providing-enterprise-machine-learning-operation-tools"
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Startup providing enterprise machine learning operation tools
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2020"
                end="2022"
              />
            </div>
          }
        >
          <Tool title="Frontend Lead">
            Took over the frontend (marketing, app, and graphql) from the CTO
            and managed sub-contractors to deliver new product features. Built
            orchestration layers for frontend engineers. Contributed to the
            CI/CD and operations integrations. Enterprise customer support and
            custom integrations of our tooling. On-call for customer and
            operational issues.
          </Tool>
          <Tool title="Technologies Used">
            Next, React, GraphQL, Typescript, Node, Go, AWS, Docker, Kubernetes,
            Ambassador, Jenkins, Grafana, Prometheus
          </Tool>
        </ToolsSection>
        <ToolsSection
          id="startup-building-interactive-multiplayer-virtual-reality-experiences"
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Startup building interactive multiplayer virtual reality
                experiences
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2019"
                end="2020"
              />
            </div>
          }
        >
          <Tool title="Web Tech Lead">
            Primarily responsible for all aspects of the web platform of a live
            event gaming company. Scheduling, leaderboards, payment,
            advertising, social sharing, and more.
          </Tool>
          <Tool title="Technologies Used">
            Next, React, GraphQL, Typescript, Node, Google Cloud, Firebase,
            Firestore, CloudFlare workers, Sentry, SSH, Docker, Kubernetes
          </Tool>
        </ToolsSection>
        <ToolsSection
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                (during this time I worked for the{" "}
                <Link
                  href="#major-stock-media-provider"
                  className="underline text-blue-500 hover:text-blue-700"
                >
                  major stock media provider
                </Link>
                )
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2015"
                end="2019"
              />
            </div>
          }
        >
          <Tool title="Creative Tools">
            Contributed to a team building an online image editor and built an
            SDK for external developers.
          </Tool>
        </ToolsSection>
        <ToolsSection
          id="major-cable-tv-and-entertainment-provider"
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Major Cable TV and Entertainment Provider
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2013"
                end="2015"
              />
            </div>
          }
        >
          <Tool title="HTML5 Embedded TV Navigator">
            Contributed to a frontend team building a consumer in-home tuner,
            streaming, and recording device that presents an HTML5 interface on
            the TV controlled by a remote. Developed numerous core features for
            the product including stream handling, security, emergency
            notification, as well as optimizing performance and memory usage for
            the embedded platform
          </Tool>
          <Tool title="Online Video Streaming">
            Contributed to a frontend team building a consumer online video
            streaming platform.
          </Tool>
          <Tool title="Technologies Used">
            Backbone, Node, REST, Embedded browsers, HLS
          </Tool>
        </ToolsSection>
        <ToolsSection
          id="technology-consulting-firm"
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Technology Consulting Firm
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2011"
                end="2013"
              />
            </div>
          }
        >
          <Tool title="Mobile Consultant">
            Helping clients achieve success with their mobile applications.
            Worked for a variety of clients either struggling with their
            existing mobile applications or looking to build new ones.
          </Tool>
          <Tool title="Technologies Used">
            iOS, Android, Objective-C, Java, PhoneGap, Titanium, HTML5, CSS3,
            Javascript, REST, SOAP, XML
          </Tool>
        </ToolsSection>
        <ToolsSection
          id="smartphone-manufacturer"
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Smartphone Manufacturer
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2005"
                end="2011"
              />
            </div>
          }
        >
          <Tool title="Automated Testing">
            Designed, built, and maintained automated testing tools for
            smartphone applications, tools, and SDKs.
          </Tool>
          <Tool title="Technologies Used">
            C, C++, Java, Python, JUnit, Jenkins, Hudson
          </Tool>
        </ToolsSection>
        <ToolsSection
          title={
            <div className="flex flex-row">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Silicon Manufacturer
              </p>
              <div className="flex-grow" />
              <TimeRange
                className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
                start="2000"
                end="2005"
              />
            </div>
          }
        >
          <Tool title="Factory Testing">
            Designed automated factory tests for embedded development boards.
          </Tool>
          <Tool title="Tools Testing">
            Designed automated testing tools and scripts for testing developer
            tools, SDKs, and examples. Designed and executed manual tests.
            Maintained and expanded example and template libraries.
          </Tool>
          <Tool title="Technologies Used">Assembly, C, C++, Perl, Python</Tool>
        </ToolsSection>
      </div>
    </SimpleLayout>
  );
}
