import { ArrowUpRight, Mail } from "lucide-react";
import { performanceColor } from "@/api/api";
import Button from "@/components/Button";
import { H1, H2, H3 } from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";
import Meter from "@/components/Meter";
import Pill from "@/components/Pill";
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
        <H2>How To Use</H2>

        <ol>
          <li>
            <strong>Search</strong> for a tissue or disease you're interested
            in. Select the most similar ontology term from the dropdown.
          </li>
          <li>
            You'll see a page of study <strong>results</strong> ranked by the
            confidence score of our text-based predictive models.
          </li>
          <li>
            <strong>Filter</strong> studies by various attributes such as
            organism, technology, sample size, etc.
          </li>
          <li>
            <strong>Select</strong> studies of interest to you by adding them to
            your cart.
          </li>
          <li>
            <strong>Download</strong> the annotations in your cart.
          </li>
          <li>
            Generate a <strong>sharable link</strong> to your cart.
          </li>
          <li>
            <strong>Export</strong> your cart to refine.bio
          </li>
        </ol>

        <h3>Checkout</h3>

        <p>
          Once you've selected your studies of interest, you may perform any of
          the following from the Data Cart:
        </p>

        <ul>
          <li>Download the annotations.</li>
          <li>Generate a sharable link to your cart.</li>
          <li>
            Create and populate a refine.bio dataset with studies that are
            shared between those you selected and those that are in{" "}
            <Link to="#refine-bio">refine.bio</Link>.
          </li>
          <li>
            Learn how to acquire the molecular data through{" "}
            <Link to="#download">other means</Link>.
          </li>
        </ul>
      </section>

      <section>
        <H2>Interpretability</H2>

        <p>We prioritize interpretability for all predicted annotations.</p>

        <p>
          Our annotations are predicted by text-based machine learning models
          developed by our group: <strong>txt2onto</strong>. A key feature of
          these models is their ability to reveal the exact words in a piece of
          text that contributed to the prediction for a particular model. These
          words are highlighted in the sample and study descriptions returned
          from a search.
        </p>
      </section>

      <section>
        <H2>Transparency</H2>

        <p>
          We also prioritize transparency for all predicted annotations. We
          indicate how much we trust the predictions in Meta2Onto at two levels:
        </p>

        <H3>Term Performance</H3>

        <p>
          For each term, we provide an indication of our confidence in all
          predicted annotations for that particular tissue or disease based on
          how well our predicted annotations matched ground-truth labels in an
          internal evaluation using an external dataset:
        </p>

        <dl className="**:w-full! **:font-regular">
          <dt>
            <Pill value="high" map={performanceColor} />
          </dt>
          <dd>Known positive studies were consistently ranked near the top.</dd>
          <dt>
            <Pill value="medium" map={performanceColor} />
          </dt>
          <dd>
            Known positive studies were generally ranked highly, with some
            exceptions.
          </dd>
          <dt>
            <Pill value="low" map={performanceColor} />
          </dt>
          <dd>Known positive studies were not reliably ranked highly.</dd>
          <dt>
            <Pill value="na" map={performanceColor} />
          </dt>
          <dd>
            Not enough ground-truth positive studies were available to
            rigorously evaluate this term.
          </dd>
        </dl>

        <H3>Prediction Confidence</H3>

        <p>
          For each search, we return a list of studies ranked by our model's
          confidence (as a calibrated logistic regression probability) that a
          given study should be annotated to your search term:
        </p>

        <div>
          <Meter value={0.5}>medium</Meter>
        </div>

        <p>
          These scores reflect the <b>model's certainty, not accuracy</b>. A
          term with low or unsure performance can still produce high-confidence
          predictions. We recommend checking the term's performance alongside
          these scores when interpreting results.
        </p>
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
        <H2>Citation</H2>

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

      <section>
        <H2 id="download">Download Data</H2>

        <p>
          We do not distribute molecular data from GEO or SRA. Rather, we direct
          users to existing resources specialized for this task. Below, we
          provide a set of brief guides for popular resources.
        </p>

        <H3>refine.bio</H3>

        <p>
          When viewing your cart, click the <i>refine.bio</i> button, and it
          will <strong>automatically</strong> create a{" "}
          <Link to="https://www.refine.bio/">refine.bio</Link> dataset with your
          selected studies! Studies not in refine.bio will be ignored.
        </p>

        <H3>ARCHS4</H3>

        <p>
          <Link to="https://archs4.org/">ARCHS4</Link> is a collection of
          uniformly aligned RNA-Seq profiles from GEO. To access the
          data/profiles for a particular study, you must download the full
          dataset for a species:
        </p>

        <ul>
          <li>
            <Link to="https://archs4.org/download">
              Human and mouse datasets
            </Link>
          </li>
          <li>
            <Link to="https://archs4.org/zoo">Other species datasets</Link>{" "}
            &ndash; e.g. Arabidopsis thaliana (mustard), Bos taurus (domestic
            cattle), Caenorhabditis elegans (worm), Danio rerio (zebrafish),
            Drosophila melanogaster (fly), Gallus gallus (red jungle foul),
            Rattus norvegicus (rat), and Saccharomyces cerevisiae (yeast)
          </li>
        </ul>

        <p>
          Once downloaded, you can use the <code>archs4py</code> Python package
          to extract sample-level expression profiles for retrieved studies from
          Meta2Onto. The ARCHS4 developers provide an{" "}
          <Link to="https://archs4.org/help">excellent tutorial here</Link>.
          Below is a brief example from their help page showing how to access
          data for a particular study.
        </p>

        <p>
          Install <code>archs4py</code>:
        </p>

        <pre>{`pip3 install archs4py`}</pre>

        <p>Retrieve sample-level expression profiles for a particular study:</p>

        <pre>{`import archs4py as a4

file = "human_gene_v2.6.h5"

#get sample counts for samples belonging to GSE64016
series_counts = a4.data.series(file, "GSE64016")`}</pre>

        <H3>recount3</H3>

        <p>
          <Link to="https://rna.recount.bio/">Recount3</Link> provides uniformly
          processed RNA-Seq data for human and mouse. If you want to download
          data from this resource, we highly recommend the{" "}
          <Link to="https://bioconductor.org/packages/release/bioc/html/recount3.html">
            recount3 R package
          </Link>
          . Below is a snippet shows how to download count matrices using this
          package. For more info, see the package documentation.
        </p>

        <pre>{`if (!requireNamespace("BiocManager", quietly = TRUE)) {
    install.packages("BiocManager")
}

BiocManager::install("recount3")

library(recount3)

# see available projects
human_projects <- available_projects()
print(head(human_projects))

# download data files
cache_dir <- recount3_cache()  # files get saved here

studies <- c("SRP107565", "SRP009615", "SRP119165", "SRP133965")
for (study in studies) {
    url <- locate_url(
        study,
        "data_sources/sra",
        type="gene",
    )

    data = file_retrieve(
        url=url, bfc=cache_dir
    )  # saves expression data to cache_dir
}`}</pre>
      </section>
    </>
  );
}
