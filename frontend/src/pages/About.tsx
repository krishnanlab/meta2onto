import { H1, H2, H3 } from "@/components/Heading";
import Link from "@/components/Link";
import Meta from "@/components/Meta";

export default function About() {
  return (
    <>
      <Meta title="About" />

      <section className="bg-theme-light">
        <H1>About</H1>
      </section>

      <section className="width-md">
        <p>
          Meta2Onto is a web interface to search through over 280,000 predicted
          standardized tissue and disease annotations for studies in the Gene
          Expression Omnibus. All annotations were predicted by our text-based
          machine learning framework,{" "}
          <Link to="https://academic.oup.com/bib/article/26/1/bbae652/7930339">
            txt2onto
          </Link>
          .
        </p>
      </section>

      <section className="width-md">
        <H2>Interpretability and Transparency</H2>

        <p>
          Meta2Onto prioritizes interpretability and transparency for all
          predicted annotations.
        </p>

        <H3>Interpretability</H3>
        <p>
          Annotations distributed by Meta2Onto are predicted by text-based
          machine learning models developed by our group{" "}
          <Link to="https://academic.oup.com/bib/article/26/1/bbae652/7930339">
            txt2onto
          </Link>
          . A key feature of these models is their ability to reveal the exact
          words in a piece of text that contributed to the prediction for a
          particular model. These words are highlighted in the sample and study
          descriptions returned from a Meta2Onto search.
        </p>

        <H3>Transparency</H3>

        <p>
          We also indicate how much we trust the predictions in Meta2Onto at two
          levels.
        </p>

        <p>
          First, for each term we provide a color-coded schema indicating our
          confidence in all predicted annotations for that particular tissue or
          disease based on txt2onto cross-validation performance.
        </p>

        <ul>
          <li>_color1_: High confidence</li>
          <li>_color2_: Medium confidence</li>
          <li>_color3_: Low confidence</li>
          <li>
            _color4_: Unsure. For these terms, we did not have a sufficient
            number of positive examples to rigorously evaluate predictive
            performance
          </li>
        </ul>

        <p>
          Second, all predictions are ranked by a confidence score. These scores
          outline the confidence of a predicted annotation for each individual
          study.
        </p>
      </section>

      <section className="width-md">
        <H2>Feedback</H2>

        <p>
          We greatly appreciate any feedback you provide. We will utilize this
          feedback internally to identify strengths and weak points in our
          prediction models to improve them in future releases.
        </p>

        <p>
          Each prediction has thumbs-up and thumbs-down buttons. If the
          thumbs-down button is clicked, a tool-tip will appear allowing you to
          further elaborate on why the prediction was incorrect.
        </p>

        <p>
          To give feedback on other aspects of Meta2Onto, please{" "}
          <Link to="#contact">reach out to us</Link>. See our{" "}
          <Link to="#privacy">Privacy Policy</Link> for more information on how
          we utilize feedback.
        </p>
      </section>

      <section className="width-md">
        <H2>Metadata</H2>

        <p>
          Metadata from GEO are pulled from{" "}
          <Link to="https://github.com/omicidx">OmicIDX</Link>, a cloud-based
          platform storing easily queryable and intelligently structured
          metadata for samples and studies in GEO, SRA, BioSamples, and
          Bioprojects.
        </p>
      </section>

      <section className="width-md">
        <H2>FAQs</H2>

        <H3>How do we predict standardized annotations?</H3>

        <p>
          Standardized annotations are predicted using the txt2onto 2.0 machine
          learning framework. Briefly, we train simple machine learning
          classifiers to learn biomedical words that are relevant to a
          particular tissue or disease. For more information, please see our
          publication.
        </p>

        <H3>How do I acquire the molecular data from my selected studies?</H3>

        <p>
          We provide instructions for how to{" "}
          <Link to="#download">acquire data through various tools</Link>.
        </p>
      </section>

      <section className="width-md">
        <H2>Citation</H2>

        <p>______</p>
      </section>

      <section className="width-md">
        <H2>Funding</H2>

        <p>
          Meta2Onto is funded in part by funds from the National Science
          Foundation (NSF BIO 2328140).
        </p>
      </section>

      <section className="width-md">
        <H2>Contact</H2>

        <p>
          Please direct any questions to{" "}
          <a href="mailto:arjun.krishnan@cuanschutz.edu">
            arjun.krishnan@cuanschutz.edu
          </a>
          .
        </p>
      </section>

      <section className="width-md">
        <H2 id="download">Download Data</H2>

        <p>
          Meta2Onto does not distribute molecular data from GEO or SRA. Rather,
          we direct users to existing resources specialized for this task.
          Below, we provide a set of brief tutorials for popular data
          distribution resources.
        </p>

        <H3>refine.bio</H3>

        <p>
          We can automatically populate a{" "}
          <Link to="https://www.refine.bio/">refine.bio</Link> dataset for you
          directly from your cart! While viewing your cart, simply click the
          Download button and select refine.bio. This will automatically
          populate a refine.bio data cart with studies that you selected that
          are included in refine.bio.
        </p>

        <H3>ARCHS4</H3>

        <p>
          <Link to="https://archs4.org/">ARCHS4</Link> is a collection of
          uniformly aligned RNA-Seq profiles from GEO [CITATION]. To access the
          data, users must download the full dataset to access the profiles for
          any study.
        </p>

        <p>
          <Link to="https://archs4.org/download">
            Download data for human and mouse here
          </Link>
          . ARCHS4 also contains datasets for other species including, but not
          limited to Arabidopsis thaliana (mustard), Bos taurus (domestic
          cattle), Caenorhabditis elegans (worm), Danio rerio (zebrafish),
          Drosophila melanogaster (fly), Gallus gallus (red jungle foul), Rattus
          norvegicus (rat), and Saccharomyces cerevisiae (yeast).{" "}
          <Link to="https://archs4.org/zoo">
            Download data for these species here
          </Link>
          .
        </p>

        <p>
          Once downloaded, you can use the <code>archs4py</code> Python package
          to extract sample-level expression profiles for retrieved studies from
          Meta2Onto. The ARCHS4 developers provide an{" "}
          <Link to="https://archs4.org/help">excellent tutorial here</Link>.
          Below is a brief example from their help page showing how to access
          data for a particular study.
        </p>

        <p>
          First install <code>archs4py</code>:
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
          processed RNA-Seq data for human and mouse. If users wish to download
          data from this resource, we highly recommend the recount3 R package.
          The following pre snippet shows how to download count matrices using
          this package:
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

        <p>
          For more information, please see the{" "}
          <Link to="https://bioconductor.org/packages/release/bioc/html/recount3.html">
            quick start guide and documentation provided by the developer
          </Link>
          .
        </p>
      </section>

      <section className="width-md">
        <H2>How To Use</H2>
        
        <p>
          Meta2Onto provides a very simple interface where users can execute
          three fundamental steps: search, select, and checkout.
        </p>
      
        <h3>Search</h3>
        <p>
          In the search bar, simply type the name of a tissue or disease of
          interest and select the most similar ontology term from the dropdown.
        </p>
      
        <h3>Select</h3>
        <p>
          Once a search is executed, you will be presented with a list of GEO
          studies ranked by the confidence score of our text-based predictive
          models. The confidence score is simply a calibrated logistic regression
          probability. You may filter this list for various study attributes such
          as organism, technology, sample size, etc. Finally, select studies
          matching your criteria of interest and click the Cart button.
        </p>
      
        <h3>Checkout</h3>
        <p>
          Once you've selected your studies of interest, you may perform any of
          the following from the Data Cart:
        </p>
        <ul>
          <li>Download the annotations.</li>
          <li>Generate a sharable link to your cart.</li>
          <li>
            Create and populate a refine.bio dataset with studies that are shared
            between those you selected and those that are in{" "}
            <Link to="#refine-bio">refine.bio</Link>.
          </li>
          <li>
            Learn how to acquire the molecular data through{" "}
            <Link to="#download">other means</Link>.
          </li>
        </ul>
      </section>
    </>
  );
}
