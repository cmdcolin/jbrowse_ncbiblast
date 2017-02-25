# Remote


A JBrowse plugin for getting BLAST results from remote services


## Configure

* blastURL - the BLAST URL including the blast.cgi. Default: https://cors-anywhere.herokuapp.com/https://blast.ncbi.nlm.nih.gov/Blast.cgi
* blastDB - the BLAST database to search. Default: nt

## Notes

By default, this app uses a CORS proxy, cors-anywhere.heroku.com, to access cross domain requests to NCBI. It is recommended to run your own CORS proxy instead of this, and you can set the blastURL config variable to reflect this. If NCBI API was structured correctly, it would allow CORS by default and not require a CORS proxy, so lobby NCBI to add this simple feature!

Note: You can also setup your own BLAST server on the Amazon or Google cloud with NCBI data https://ncbi.github.io/blast-cloud/doc/setting-up-blast.html
