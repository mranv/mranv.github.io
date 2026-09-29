/* Living atlas content. Edit this file only when the life changes.
   The walk reads `signs` and `scenery`. The map reads everything else.
   Sign `x` is pixels from the left of the path. `color` is the mark
   that carries into the map. A sign with `gate: true` ends the walk
   and does not become a color. */
window.ATLAS = {
  world: {
    width: 6200,
    speed: 380
  },
  person: {
    name: "Anubhav Gain",
    kicker: "Saying “No” as a service",
    sentence: "I build the controls that decide what an endpoint is allowed to run, and I still keep a fish hatchery in Pakhanjur.",
    where: "Ahmedabad for the work. Pakhanjur for the water. Vadodara is where the desk started.",
    study: "Cyber forensics at Parul University, B.Tech, 2021–2025. A licentiate in cybersecurity management from Charles Sturt, 2023.",
    now: "I work with Infopercept from Ahmedabad. Since May 2026 the desk has been in Mumbai, on endpoint control for Mahindra Finance: what is allowed to run, a policy trail that can be reviewed, and telemetry across Windows, macOS, and Linux. The Invinsense work on the same desk is OpenSearch dashboards, Rust agents, and the Wazuh and Fluent Bit side of the deploy."
  },
  signs: [
    {
      id: "water",
      x: 1320,
      color: "#2f6f62",
      year: "2020",
      place: "Pakhanjur",
      line: "The hatchery."
    },
    {
      id: "campus",
      x: 2360,
      color: "#c4a15a",
      year: "2022",
      place: "Vadodara",
      line: "Forensics, and the university’s own machines."
    },
    {
      id: "wires",
      x: 3280,
      color: "#b85c38",
      year: "2023",
      place: "Ahmedabad",
      label: "Ahmedabad ’23",
      line: "Pipelines, then a security desk."
    },
    {
      id: "kernel",
      x: 4280,
      color: "#3d4d78",
      year: "2024",
      place: "Ahmedabad",
      label: "Ahmedabad ’24",
      line: "Invinsense, in Rust and dashboards."
    },
    {
      id: "policy",
      x: 5080,
      color: "#1c1916",
      year: "2026",
      place: "Mumbai",
      line: "What an endpoint is allowed to run."
    },
    {
      id: "gate",
      x: 5720,
      gate: true,
      place: "The map",
      line: "The path ends here."
    }
  ],
  scenery: [
    { kind: "stone", x: 140 },
    { kind: "reed", x: 300 },
    { kind: "bush", x: 430 },
    { kind: "pond", x: 560 },
    { kind: "tree", x: 820 },
    { kind: "stone", x: 980 },
    { kind: "reed", x: 1080 },
    { kind: "bush", x: 1480 },
    { kind: "tree", x: 1620 },
    { kind: "pond", x: 1780 },
    { kind: "reed", x: 1980 },
    { kind: "campus", x: 2040 },
    { kind: "bush", x: 2490 },
    { kind: "tree", x: 2620 },
    { kind: "stone", x: 2760 },
    { kind: "wires", x: 2920 },
    { kind: "tree", x: 3420 },
    { kind: "stone", x: 3560 },
    { kind: "wires", x: 3680 },
    { kind: "bush", x: 3920 },
    { kind: "rack", x: 4040 },
    { kind: "stone", x: 4120 },
    { kind: "wires", x: 4480 },
    { kind: "rack", x: 4700 },
    { kind: "stone", x: 4880 },
    { kind: "bush", x: 5340 }
  ],
  places: [
    {
      color: "#2f6f62",
      name: "Field notes",
      href: "https://mranv.pages.dev/",
      beat: "Writing on detection, eBPF, and the tools I actually run.",
      note: "Latest: MSCRED, unsupervised anomaly detection in multivariate time series.",
      date: "2025-10-07",
      dateLabel: "7 Oct 2025",
      noteHref: "https://mranv.pages.dev/posts/2025/machine-learning/mscred-anomaly-detection-multivariate-timeseries/"
    },
    {
      color: "#3d4d78",
      name: "GitHub",
      href: "https://github.com/mranv",
      beat: "Notes, experiments, and the public shelf under my name.",
      note: "Also the work shelf, anubhavg-icpl, for tools from the engineering desk."
    },
    {
      color: "#3d4d78",
      name: "Work shelf",
      href: "https://github.com/anubhavg-icpl",
      beat: "Repositories I publish from the Infopercept desk.",
      note: "Leviathan, Agni, Krustron, and the application-control notes live here."
    },
    {
      color: "#c4a15a",
      name: "ORCID",
      href: "https://orcid.org/0009-0004-4131-5428",
      beat: "The research record, kept apart from the blog.",
      note: "0009-0004-4131-5428"
    },
    {
      color: "#1c1916",
      name: "This atlas",
      href: "https://mranv.github.io/",
      beat: "The map you are standing on.",
      note: "Set down in 2026. The walk is the introduction."
    },
    {
      color: "#b85c38",
      name: "Previous site",
      href: "/old/",
      beat: "The résumé page this replaced.",
      note: "Kept, with its own pictures and the old copy."
    }
  ],
  practices: [
    {
      color: "#2f6f62",
      name: "Gain Fisheries",
      beat: "A hatchery in Pakhanjur, Chhattisgarh, since August 2020. Breeding, water, and the part of the week that is not a terminal.",
      note: "No public site. It is still running."
    },
    {
      color: "#c4a15a",
      name: "TechAnv",
      href: "https://mranv.pages.dev/",
      beat: "A research desk in Vadodara, since December 2022. Threat work, proofs, and notes. Not a storefront.",
      note: "The writing is on the field notes. The code is on GitHub."
    }
  ],
  tools: [
    {
      color: "#3d4d78",
      name: "leviathan",
      href: "https://github.com/anubhavg-icpl/leviathan",
      beat: "Windows re-engineered driver samples."
    },
    {
      color: "#3d4d78",
      name: "agni",
      href: "https://github.com/anubhavg-icpl/agni",
      beat: "A terminal UI for Firecracker microVMs, in place of firectl flags."
    },
    {
      color: "#3d4d78",
      name: "krustron",
      href: "https://github.com/anubhavg-icpl/krustron",
      beat: "An open-source Devtron alternative: one dashboard for GitOps, more than one cluster, and access control."
    },
    {
      color: "#1c1916",
      name: "appControlBusiness",
      href: "https://github.com/anubhavg-icpl/appControlBusiness",
      beat: "Working notes on application control for business, centered on WDAC."
    }
  ],
  earlier: [
    { when: "2020 —", text: "Gain Fisheries, Pakhanjur. The hatchery. Still going." },
    { when: "2022 —", text: "IT for Parul University, Vadodara. Palo Alto firewalls, AWS, labs, and servers, while the degree was still underway." },
    { when: "2022 —", text: "TechAnv, Vadodara. Personal research. Still the desk beside the job." },
    { when: "2023 —", text: "Lucid Growth, Bengaluru, remote. A short security posting, October to November." },
    { when: "2023 —", text: "Atcults, Ahmedabad. DevSecOps until July 2024: pipelines, Kubernetes, AWS, and the checks inside them." },
    { when: "2024 —", text: "Infopercept, Ahmedabad. Security software for Invinsense. Still the employer." },
    { when: "2026 —", text: "SBI Life, through Infopercept, March to May. Application security reviews. That posting has ended." }
  ],
  hire: [
    {
      title: "Endpoint control",
      text: "Allow-lists, policy someone can review before it is deployed, and telemetry an audit can read."
    },
    {
      title: "Detection and response",
      text: "XDR work and OpenSearch. The path from an alert to a sentence a person can use."
    },
    {
      title: "Tools and infrastructure",
      text: "Rust and Go, containers, and the deploy that has to keep running after the demo."
    }
  ],
  contact: [
    { label: "Email", href: "mailto:iamanubhavgain@gmail.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/anubhavgain" },
    { label: "GitHub", href: "https://github.com/mranv" },
    { label: "Work shelf", href: "https://github.com/anubhavg-icpl" },
    { label: "X", href: "https://x.com/AnubhavGain" },
    { label: "Field notes", href: "https://mranv.pages.dev/" },
    { label: "ORCID", href: "https://orcid.org/0009-0004-4131-5428" }
  ],
  colophon: "2026. Type is Fraunces and Atkinson Hyperlegible. The path is CSS, not a game engine. The previous site is kept at /old/."
};
