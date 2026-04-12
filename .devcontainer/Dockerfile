FROM node:25-alpine3.22

# Install TypeScript globally
RUN npm install -g typescript

# Install git
RUN apk add --no-cache git

# Install zsh
RUN apk add --no-cache zsh

# Set zsh as default shell
RUN apk add shadow && chsh -s /bin/zsh

# Install oh-my-zsh
RUN sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Install python (required for some npm packages)
RUN apk add --no-cache python3 make g++ && rm -rf /var/cache/apk/*