# this script is used to publish the package to a local directory for testing.
# it will build the package, create a tarball, extract it to a directory and link it.
# in the demo app run `npm link @ptrn/react` then `npm run preview`

npm run build && npm pack && tar -xf ptrn-ui*.tgz package && cd package && npm link && cd .. 
