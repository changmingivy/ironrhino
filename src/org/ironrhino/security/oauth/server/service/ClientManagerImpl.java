package org.ironrhino.security.oauth.server.service;

import java.io.Serializable;
import java.util.List;

import org.ironrhino.core.cache.CheckCache;
import org.ironrhino.core.cache.EvictCache;
import org.ironrhino.core.service.BaseManagerImpl;
import org.ironrhino.security.oauth.server.model.Client;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class ClientManagerImpl extends BaseManagerImpl<Client> implements ClientManager {

	@Override
	@Transactional(readOnly = true)
	@CheckCache(namespace = "oauth:client", key = "${id}", timeToIdle = "3600")
	public Client get(Serializable id) {
		return super.get(id);
	}

	@Override
	@Transactional
	@EvictCache(namespace = "oauth:client", key = "${client.id}")
	public void delete(Client client) {
		super.delete(client);
	}

	@Override
	@Transactional
	@EvictCache(namespace = "oauth:client", key = "${client.id}")
	public void save(Client client) {
		super.save(client);
	}

	@Override
	@Transactional
	@EvictCache(namespace = "oauth:client", key = "${key = [];foreach (client : retval) { key.add(client.id);} return key;}")
	public List<Client> delete(Serializable... id) {
		return super.delete(id);
	}

}
