#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d turtleshelter2-3.is404.net -d intexturtle.us-east-1.elasticbeanstalk.com  --nginx --agree-tos --email micrindi@byu.edu
