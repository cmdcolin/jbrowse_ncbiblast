# Remote


A JBrowse plugin for getting BLAST results from remote services

## Install

Clone the repo to plugins/RemoteBlast, and add this to your configuration in jbrowse_conf.json or trackList.json

    "plugins": ["RemoteBlast"]

See JBrowse FAQ for installing plugins

## Install dependencies

Then also go into the RemoteBlast folder and run

    bower install

This installs the jszip dependency because NCBI is crazy and returns it's JSON API results as a zip file (not normal gzip web compression)

## Configure

You can set these global configuration values (in jbrowse_conf.json or jbrowse.conf) to configure the app

* blastURL - the BLAST URL including the blast.cgi. Default: https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi
* blastDB - the BLAST database to search. Default: nt
* taxid - the taxon ID of the genome you are viewing

## Notes

* This app uses a CORS proxy, cors-anywhere.heroku.com, to perform cross domain requests to NCBI. You can run your own CORS proxy as well, or you can bother NCBI to [enable CORS](https://enable-cors.org/)
* You can also setup your own BLAST server on the Amazon or Google cloud with NCBI data https://ncbi.github.io/blast-cloud/doc/setting-up-blast.html
* The Ensembl REST API is used to translate cDNA coordinates of results into genomic coordinates
