#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import webapp2
import datetime
import json
import logging
import urllib, urllib2
from google.appengine.ext import db
from api_keys import CLIENT_ID, CLIENT_SECRET

OAUTH_EXPIRES_SECONDS = 9 * 60;
MAX_TEXT_LENGTH = 200;
MAX_DETECT_LENGTH = 200;


class CachedTranslation(db.Model):
  fromLang = db.StringProperty()
  toLang = db.StringProperty()
  fromText = db.StringProperty()
  toText = db.StringProperty()


class CachedDetection(db.Model):
  text = db.StringProperty()
  detectedLang = db.StringProperty()


class OAuthTokenCache(db.Model):
  token = db.StringProperty()
  tokenTime = db.DateTimeProperty(auto_now_add=True)
  

class TranslateHandler(webapp2.RequestHandler):
  """Get a translation for a term, looking first in the local cache, then to 
     the Microsoft Translation API."""
  def get(self):
    toLang = self.request.get('to')
    fromLang = self.request.get('from')
    text = self.request.get('text')
    
    if not toLang or not fromLang or not text:
      self.response.write('Request must include a valid text and to/from languages.')
      return 
    
    # Look to see if we've cached this before
    text = text[:MAX_TEXT_LENGTH]
    cachedTranslation = CachedTranslation.gql('WHERE fromLang = :1 AND toLang = :2 AND' +
                                              ' fromText = :3', fromLang, toLang, text).get()
    logging.info(cachedTranslation)
    
    # If not, look it up and cache it
    if cachedTranslation is None:
      token = getOAuthToken()
      translationUrl = 'http://api.microsofttranslator.com/V2/Ajax.svc/Translate?'
      translationArgs = {'to': toLang.encode('utf-8'),
                         'from': fromLang.encode('utf-8'),
                         'text': text.encode('utf-8')}
      encodedTranslationArgs = urllib.urlencode(translationArgs)
      translationHeaders={'Authorization': 'Bearer ' + token}
      translationRequest = urllib2.Request(translationUrl + encodedTranslationArgs,
                                           headers=translationHeaders)
      translationResponse = urllib2.urlopen(translationRequest).read().decode('utf-8')
      translationResponse = translationResponse[2:len(translationResponse) - 1]
      logging.info(translationResponse)
      cachedTranslation = CachedTranslation(toLang=toLang, fromLang=fromLang,
                                            fromText=text, toText=translationResponse)
      cachedTranslation.put()
    self.response.write(cachedTranslation.toText)


class DetectLanguageHandler(webapp2.RequestHandler):
  """Detect the language for a string of text."""
  def get(self):
    text = self.request.get('text')
    if not text:
      self.response.write('Request must include a valid text to run detection on.')
      return 
    
    # Look to see if we've done this detection before
    text = text[:MAX_DETECT_LENGTH]
    cachedDetection = CachedDetection.gql('WHERE text = :1', text).get()
    logging.info(cachedDetection)
    
    # If not, look it up and cache it
    if cachedDetection is None:
      token = getOAuthToken()
      detectionUrl = 'http://api.microsofttranslator.com/V2/Ajax.svc/Detect?'
      detectionArgs = {'text': text.encode('utf-8')}
      encodedDetectionArgs = urllib.urlencode(detectionArgs)
      detectionHeaders={'Authorization': 'Bearer ' + token}
      detectionRequest = urllib2.Request(detectionUrl + encodedDetectionArgs,
                                           headers=detectionHeaders)
      detectionResponse = urllib2.urlopen(detectionRequest).read().decode('utf-8')
      detectionResponse = detectionResponse[2:len(detectionResponse) - 1]
      logging.info(detectionResponse)
      cachedDetection = CachedDetection(text=text, detectedLang=detectionResponse)
      cachedDetection.put()
    self.response.write(cachedDetection.detectedLang)


def getOAuthToken():
  """Get the current OAuth token from the cache and return it, or 
     fetch a fresh one if necessary."""
  # See if we have a cached token that will work
  cachedTokens = OAuthTokenCache.all()
  if cachedTokens.count() == 1:
    cachedToken = cachedTokens[0]
    cachedTokenAge = (datetime.datetime.now() - cachedToken.tokenTime).seconds
    if cachedTokenAge < OAUTH_EXPIRES_SECONDS:
      return cachedToken.token
  
  # Otherwise delete any existing tokens, then fetch and save new one
  for cachedToken in cachedTokens:
    cachedToken.delete()
  oauthUrl = 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13'
  args = {
    'client_id': 'translationtracker',
    'client_secret': 'ZkVFo/7OldHYujF/ObVKkUQz6hvem1t9pc34sT9lvXU',
    'scope': 'http://api.microsofttranslator.com',
    'grant_type': 'client_credentials'
  }
  encodedArgs =  urllib.urlencode(args)
  oauthRequest = urllib2.Request(oauthUrl, encodedArgs)
  oauthResponse = urllib2.urlopen(oauthRequest).read()
  oauthJSON = json.loads(oauthResponse)
  cachedToken = OAuthTokenCache(token=oauthJSON.get('access_token'))
  cachedToken.put()
  return cachedToken.token

app = webapp2.WSGIApplication([
  ('/translate', TranslateHandler),
  ('/detect', DetectLanguageHandler)
], debug=True)
