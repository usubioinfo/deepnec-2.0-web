#!/usr/bin/env python3
# Author: Naveen Duhan
"""
deepNEC 2.0: Publication-Ready Prediction Visualizations Generator
Generates colorblind-safe, journal-quality figures from deepNEC prediction results.
"""

import os
import sys
import argparse
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Colorblind-safe Okabe-Ito palette
OKABE_ITO = ['#56B4E9', '#009E73', '#E69F00', '#0072B2', '#D55E00', '#CC79A7', '#F0E442', '#999999']

# Set publication style conforming to scientific-visualization standards
sns.set_theme(style="ticks")
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Arial', 'Helvetica', 'DejaVu Sans'],
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 13,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'figure.titlesize': 14,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight'
})

try:
    from deepNEC.config import PATHWAY_EC_MAPPING, DIRECT_EC_MAPPING
except ImportError:
    try:
        from config import PATHWAY_EC_MAPPING, DIRECT_EC_MAPPING
    except ImportError:
        PATHWAY_EC_MAPPING = {
            'Nitrification': ['1.14.99.39', '1.7.2.6'],
            'Denitrification': ['1.7.2.1', '1.7.2.5', '1.7.99.7'],
            'Assimilation': ['1.7.1.1', '1.7.7.1', '1.7.7.2'],
            'Dissimilation': ['1.7.1.15', '1.7.2.2'],
            'Anammox': ['1.7.2.7', '1.7.2.8']
        }
        DIRECT_EC_MAPPING = {'Nitrogen Fixation': '1.18.6.1'}


def plot_pathway_distribution(df, output_path):
    """
    Plots horizontal bar chart of sequence counts per nitrogen metabolism pathway
    using colorblind-accessible palettes and value annotations.
    """
    if 'Pathway' not in df.columns:
        print("[WARNING] 'Pathway' column not found. Skipping pathway distribution plot.")
        return

    fig, ax = plt.subplots(figsize=(7, 4.5))
    pathway_counts = df['Pathway'].value_counts()

    palette = sns.color_palette("cividis", len(pathway_counts))

    bars = sns.barplot(
        x=pathway_counts.values,
        y=pathway_counts.index,
        palette=palette,
        hue=pathway_counts.index,
        legend=False,
        ax=ax
    )

    # Add numeric annotations to bars
    for i, count in enumerate(pathway_counts.values):
        ax.text(count + max(pathway_counts.values)*0.01, i, f" {count}", va='center', fontweight='bold', fontsize=9)

    ax.set_title("Sequence Count per Nitrogen Metabolism Pathway", pad=12, fontweight='bold')
    ax.set_xlabel("Number of Predicted Sequences")
    ax.set_ylabel("Nitrogen Pathway")

    # Outward spine offset & despine
    ax.spines['left'].set_position(('outward', 6))
    ax.spines['bottom'].set_position(('outward', 6))
    sns.despine(top=True, right=True, ax=ax)

    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"[PLOT] Pathway distribution saved to: {output_path}")


def plot_ec_distribution(df, output_path):
    """
    Plots a colorblind-safe donut chart representing the distribution of predicted EC Numbers.
    """
    if 'EC_Number' not in df.columns:
        print("[WARNING] 'EC_Number' column not found. Skipping EC distribution plot.")
        return

    fig, ax = plt.subplots(figsize=(6, 5.5))
    ec_counts = df['EC_Number'].value_counts()

    if len(ec_counts) > 10:
        top_ec = ec_counts.iloc[:9]
        others = pd.Series([ec_counts.iloc[9:].sum()], index=['Other ECs'])
        ec_counts = pd.concat([top_ec, others])

    colors = OKABE_ITO[:len(ec_counts)]

    wedges, texts, autotexts = ax.pie(
        ec_counts.values,
        labels=ec_counts.index,
        autopct='%1.1f%%',
        startangle=140,
        colors=colors,
        wedgeprops=dict(width=0.45, edgecolor='w', linewidth=1.5),
        pctdistance=0.75
    )

    for autotext in autotexts:
        autotext.set_fontsize(8)
        autotext.set_fontweight('bold')

    ax.set_title("Distribution of Predicted EC Numbers", pad=12, fontweight='bold')
    plt.tight_layout()

    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"[PLOT] EC distribution donut chart saved to: {output_path}")


def plot_pathway_completeness(df, output_path):
    """
    Plots pathway completeness heatmap based on presence/absence of expected EC numbers
    using perceptually uniform YlGnBu colormap.
    """
    if 'EC_Number' not in df.columns:
        print("[WARNING] 'EC_Number' column not found. Skipping pathway completeness heatmap.")
        return

    expected_ecs = {}
    for pathway, ecs in PATHWAY_EC_MAPPING.items():
        expected_ecs[pathway.capitalize()] = ecs
    for pathway, ec in DIRECT_EC_MAPPING.items():
        expected_ecs[pathway.capitalize()] = [ec]

    predicted_ecs = set(df['EC_Number'].unique())

    completeness_data = []
    for pathway, ecs in expected_ecs.items():
        found = [ec for ec in ecs if ec in predicted_ecs]
        pct = (len(found) / len(ecs)) * 100 if ecs else 0.0
        completeness_data.append({
            'Pathway': pathway,
            'Completeness': pct
        })

    comp_df = pd.DataFrame(completeness_data)

    fig, ax = plt.subplots(figsize=(7, 4))
    matrix = comp_df.set_index('Pathway')[['Completeness']]

    sns.heatmap(
        matrix,
        annot=True,
        fmt=".1f",
        cmap="YlGnBu",
        cbar_kws={'label': 'Pathway Completeness (%)'},
        vmin=0,
        vmax=100,
        linewidths=0.5,
        ax=ax
    )

    ax.set_title("Nitrogen Cycle Pathway Completeness Profile", pad=12, fontweight='bold')
    ax.set_ylabel("")
    ax.set_xlabel("")

    plt.tight_layout()
    plt.savefig(output_path, dpi=300)
    plt.close()
    print(f"[PLOT] Pathway completeness heatmap saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="deepNEC 2.0 Visualization Generator: Create publication-quality plots from prediction results."
    )
    parser.add_argument("-i", "--input_tsv", required=True, help="Input predictions TSV file path")
    parser.add_argument("-od", "--output_dir", default="deepnec_plots", help="Directory to save generated plots")

    args = parser.parse_args()

    if not os.path.exists(args.input_tsv):
        print(f"[ERROR] Predictions file '{args.input_tsv}' does not exist.")
        sys.exit(1)

    os.makedirs(args.output_dir, exist_ok=True)

    df = pd.read_csv(args.input_tsv, sep="\t")
    if df.empty:
        print("[WARNING] Predictions spreadsheet is empty. No plots generated.")
        sys.exit(0)

    plot_pathway_distribution(df, os.path.join(args.output_dir, "pathway_distribution.png"))
    plot_ec_distribution(df, os.path.join(args.output_dir, "ec_distribution.png"))
    plot_pathway_completeness(df, os.path.join(args.output_dir, "pathway_completeness.png"))


if __name__ == "__main__":
    main()
