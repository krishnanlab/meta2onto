import { ArrowUpRight, Mail } from "lucide-react";
import Button from "@/components/Button";
import { H1, H2 } from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";
import { formatNumber } from "@/util/string";

export default function About() {
  return (
    <>
      <Meta title="About" />

      <section className="bg-theme-light">
        <H1>About</H1>
      </section>

      <section>
        <p>
          <strong>Meta2Onto</strong> is a web app to search through over{" "}
          {formatNumber(280000)} predicted standardized tissue and disease
          annotations for studies in the{" "}
          <Link to="https://www.ncbi.nlm.nih.gov/geo/">
            Gene Expression Omnibus
          </Link>{" "}
          (GEO). We predict standardized annotations using our text-based
          machine learning framework <strong>txt2onto</strong>, which trains
          simple machine learning classifiers to learn biomedical words that are
          relevant to a particular tissue or disease.
        </p>

        <Button to={import.meta.env.VITE_TXT2ONTO} className="self-center">
          Learn more about txt2onto
          <ArrowUpRight />
        </Button>
      </section>

      <section>
        <H2>Feedback</H2>

        <p>
          Next to each prediction you'll see thumbs-up and thumbs-down buttons.
          Click the thumbs up to tell us you think the prediction is correct and
          the thumbs down to tell us you think the prediction is incorrect and
          elaborate on why. We greatly appreciate any feedback you provide.
        </p>

        <p>
          We use this feedback internally to identify strengths and weak points
          in our prediction models and improve them in future releases. See our{" "}
          <Link to="#privacy">Privacy Policy</Link> for more info. To give
          feedback on other aspects of Meta2Onto, please{" "}
          <Link to="#contact">contact us</Link>.
        </p>
      </section>

      <section>
        <H2>Metadata</H2>

        <p>
          We pull GEO metadata from{" "}
          <Link to="https://github.com/omicidx">OmicIDX</Link>, a cloud-based
          platform storing easily queryable and intelligently structured
          metadata for samples and studies in GEO, SRA, BioSamples, and
          Bioprojects.
        </p>
      </section>

      <section>
        <H2>Cite</H2>

        <blockquote>
          title
          <br />
          authors
          <br />
          other
        </blockquote>
      </section>

      <section>
        <H2>Funding</H2>

        <p>
          Meta2Onto is funded in part by funds from the National Science
          Foundation (NSF BIO 2328140).
        </p>
      </section>

      <section>
        <H2>Contact</H2>

        <Button
          to={`mailto:${import.meta.env.VITE_EMAIL}`}
          className="self-center"
        >
          <Mail />
          Arjun Krishnan
        </Button>
      </section>
    </>
  );
}
