import { FC } from "react";
import { AnimatedLinkCard } from "./AnimatedLinkCard";
import { Container } from "@/components/Container";

const defaultCardMediaProps = {
  component: "img",
  className: "object-contain px-2",
};

const HomePage: FC = () => {
  const delayGenerator = (() => {
    let delay = 250;
    return () => {
      delay += 250;
      return delay;
    };
  })();

  return (
    <Container className="mt-16 sm:mt-32">
      <div className="grid lg:grid-cols-2 sm:grid-cols-1 gap-4">
        <div className="pl-8 h-full">
          <AnimatedLinkCard
            to="https://www.bitflick.xyz"
            headerTitle="Bitflick"
            CardMediaProps={{
              ...defaultCardMediaProps,
              src: "/206.png",
              alt: "Bitflick",
              width: 400,
              height: 400,
            }}
            delay={delayGenerator()}
            content="Ordinals inscription website for lazy mints of recursive ordinals"
          />
        </div>
        <div className="pl-8 h-full">
          <AnimatedLinkCard
            to="https://fameladysociety.com"
            headerTitle="Fame Lady Society"
            CardMediaProps={{
              src: "/fls-wrap.gif",
              alt: "Fame Lady Society",
              width: 400,
              height: 400,
            }}
            delay={delayGenerator()}
            content="NFT wrapper and website for the Fame Lady Society"
          />
        </div>
        <div className="pl-8">
          <AnimatedLinkCard
            to="https://nameflick.com"
            headerTitle="NameflickENS"
            CardMediaProps={{
              ...defaultCardMediaProps,
              src: "/flick.png",
              alt: "NameflickENS",
              width: 400,
              height: 400,
            }}
            delay={delayGenerator()}
            content="Nameflick gives your ENS super-powers"
          />
        </div>
        <div className="pl-8">
          <AnimatedLinkCard
            to="/gas"
            headerTitle="On Chain Gas"
            CardMediaProps={{
              ...defaultCardMediaProps,
              src: "/preview.gif",
              alt: "On Chain Gas",
              width: 400,
              height: 400,
            }}
            delay={delayGenerator()}
            content="The OG on-chain gas meter"
          />
        </div>
        <div className="pl-8">
          <AnimatedLinkCard
            to="/check"
            headerTitle="On Chain Check Gas"
            CardMediaProps={{
              ...defaultCardMediaProps,
              src: "/check_preview.gif",
              alt: "On Chain Check Gas",
              width: 400,
              height: 400,
            }}
            delay={delayGenerator()}
            content={
              <>
                <div>Derivative check on chain gas meter</div>
                <div>Free claim for OG holders and open edition</div>
              </>
            }
          />
        </div>
      </div>
    </Container>
  );
};

export default HomePage;
