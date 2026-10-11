export default {
  fetch(request) {
    const destination = new URL(request.url);
    destination.protocol = 'https:';
    destination.host = 'botbuilder.mipmap.ai';
    return new Response(null, {
      status: 308,
      headers: {
        Location: destination.href,
        'Cache-Control': 'no-cache',
      },
    });
  },
};
